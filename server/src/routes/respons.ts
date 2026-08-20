import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { nilaiDimensi, nilaiAkhir, kategori, DIMENSI_BUTIR } from "../utils/scoring.js";
import { sseHub } from "../utils/sse.js";
import { auth } from "../middleware/auth.js";

export const responsRouter = Router();

// ── POST /api/respons — submit publik (rate-limited di index.ts) ──
const submitSchema = z.object({
  periodeId: z.string().min(1),
  templateKode: z.string().min(1),
  identitas: z.object({
    nama: z.string().min(1),
    jabatan: z.string().min(1),
    unit: z.string().optional().nullable(),
    prodi: z.string().optional().nullable(),
    fakultas: z.string().optional().nullable(),
    kewarganegaraan: z.string().optional().nullable(),
    negara: z.string().optional().nullable(),
    negaraAsal: z.string().optional().nullable(),
    asalNegara: z.string().optional().nullable(),
  }),
  jawabanSkala: z.array(z.object({ butirId: z.string(), skor: z.number().int().min(1).max(4) })).min(1),
  jawabanTerbuka: z.object({
    q21: z.string().optional().nullable(),
    q22: z.string().optional().nullable(),
    q23: z.string().optional().nullable(),
    q24: z.string().optional().nullable(),
    q25: z.string().optional().nullable(),
  }).optional().nullable(),
});

responsRouter.post("/", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { periodeId, templateKode, identitas, jawabanSkala, jawabanTerbuka } = parsed.data;
  const kode = templateKode.toUpperCase();

  const periode = await prisma.periodeMonev.findUnique({ where: { id: periodeId } });
  if (!periode) return res.status(404).json({ error: "Periode tidak ditemukan" });
  if (periode.status !== "aktif") return res.status(409).json({ error: "Periode tidak aktif, pengisian ditutup" });

  const tpl = await prisma.angketTemplate.findUnique({ where: { kode } });
  if (!tpl) return res.status(404).json({ error: "Jenis angket tidak valid" });

  const expected = DIMENSI_BUTIR[kode];
  if (!expected) return res.status(400).json({ error: "Template belum dikonfigurasi" });
  // Validasi butirId milik template & jumlah
  const butirList = await prisma.butir.findMany({ where: { templateId: kode, aktif: true } });
  const butirMap = new Map(butirList.map((b) => [b.id, b]));
  const butirByDimensi: Record<string, typeof butirList> = {};
  for (const b of butirList) (butirByDimensi[b.dimensi] ??= []).push(b);

  // Identitas: fakultas/prodi wajib untuk FAK, SEK, MHS
  if ((kode === "FAK" || kode === "SEK" || kode === "MHS") && (!identitas.fakultas || !identitas.prodi)) {
    return res.status(400).json({ error: "Fakultas dan Program Studi wajib untuk angket ini" });
  }
  // MHS Warga Negara Asing wajib negara asal (terima WNA maupun label lengkap)
  if (kode === "MHS") {
    const kwRaw = String((identitas as any).kewarganegaraan ?? "").trim().toUpperCase();
    const isWNA = kwRaw === "WNA" || kwRaw.includes("ASING");
    const negara = String((identitas as any).negara ?? (identitas as any).negaraAsal ?? (identitas as any).asalNegara ?? "").trim();
    if (isWNA && !negara) return res.status(400).json({ error: "Asal negara wajib untuk Warga Negara Asing" });
  }

  const seen = new Set<string>();
  for (const j of jawabanSkala) {
    if (!butirMap.has(j.butirId)) return res.status(400).json({ error: `Butir tidak valid: ${j.butirId}` });
    if (seen.has(j.butirId)) return res.status(400).json({ error: `Duplikat butir: ${j.butirId}` });
    seen.add(j.butirId);
  }
  if (jawabanSkala.length !== butirList.length) {
    return res.status(400).json({ error: `Jumlah jawaban harus ${butirList.length}, diterima ${jawabanSkala.length}` });
  }

  // Hitung skor per dimensi
  const skorPerDimensi: Record<string, number> = {};
  const nilaiPerDimensi: Record<string, number> = {};
  for (const [dim, list] of Object.entries(butirByDimensi)) {
    let s = 0;
    for (const b of list) {
      const j = jawabanSkala.find((x) => x.butirId === b.id)!;
      s += j.skor;
    }
    skorPerDimensi[dim] = s;
    nilaiPerDimensi[dim] = nilaiDimensi(s, list.length);
  }
  const nilaiAkhirVal = nilaiAkhir(Object.values(nilaiPerDimensi));
  const kat = kategori(nilaiAkhirVal);

  // Mapping ke kolom denormalized (untuk query & SSE cepat)
  // Respons punya skorInput/Proses/Output; SEK & MHS dimapping ke kolom yang ada
  const dimOrder = Object.keys(expected);
  const pick = (names: string[]) => {
    for (const n of names) if (nilaiPerDimensi[n] !== undefined) return nilaiPerDimensi[n];
    return null;
  };
  const nilaiInput = pick([dimOrder[0]]) ?? null;
  const nilaiProses = pick([dimOrder[1]]) ?? null;
  const nilaiOutput = pick([dimOrder[2]]) ?? (dimOrder.length === 1 ? nilaiAkhirVal : null);
  const skorInput = skorPerDimensi[dimOrder[0]] ?? null;
  const skorProses = skorPerDimensi[dimOrder[1]] ?? null;
  const skorOutput = skorPerDimensi[dimOrder[2]] ?? (dimOrder.length === 1 ? Object.values(skorPerDimensi)[0] : null);

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
  const ua = req.headers["user-agent"] ?? null;

  const created = await prisma.$transaction(async (tx) => {
    const r = await tx.respons.create({
      data: {
        periodeId, templateKode: kode, identitas: identitas as any, status: "submitted",
        skorInput, skorProses, skorOutput, nilaiInput, nilaiProses, nilaiOutput,
        nilaiAkhir: nilaiAkhirVal, kategori: kat.label, tindakLanjut: kat.tindak,
        ip, userAgent: ua,
      },
    });
    await tx.jawabanSkala.createMany({ data: jawabanSkala.map((j) => ({ responsId: r.id, butirId: j.butirId, skor: j.skor })) });
    if (jawabanTerbuka && Object.values(jawabanTerbuka).some((v) => v && String(v).trim())) {
      await tx.jawabanTerbuka.create({ data: { responsId: r.id, q21: jawabanTerbuka.q21 ?? null, q22: jawabanTerbuka.q22 ?? null, q23: jawabanTerbuka.q23 ?? null, q24: jawabanTerbuka.q24 ?? null, q25: jawabanTerbuka.q25 ?? null } });
    }
    return r;
  });

  sseHub.broadcast("respons:created", { id: created.id, periodeId, templateKode: kode, nilaiAkhir: nilaiAkhirVal, kategori: kat.label }, periodeId);

  // balikan skor untuk halaman terima kasih (tanpa bocorkan butir orang lain)
  res.status(201).json({
    id: created.id,
    nilaiAkhir: nilaiAkhirVal,
    kategori: kat.label,
    tindakLanjut: kat.tindak,
    nilaiPerDimensi,
  });
});

// ── GET /api/respons — admin list dengan filter ──
responsRouter.get("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const { periodeId, templateKode, kategori: katQ, fakultas, q, page: pageQ, pageSize: psQ } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt(pageQ ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(psQ ?? "20", 10) || 20));
  const where: any = {};
  if (periodeId) where.periodeId = periodeId;
  if (templateKode) where.templateKode = templateKode.toUpperCase();
  if (katQ) where.kategori = katQ;
  if (q) where.identitas = { path: "$.nama", string_contains: q } as any; // MySQL JSON search — fallback ke client filter jika tidak support
  // fakultas filter via JSON path bila tersedia
  let list: any[] = [];
  let total = 0;
  try {
    total = await prisma.respons.count({ where });
    list = await prisma.respons.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { jawabanTerbuka: true } });
  } catch {
    // fallback tanpa JSON filter
    const base: any = {};
    if (periodeId) base.periodeId = periodeId;
    if (templateKode) base.templateKode = templateKode.toUpperCase();
    if (katQ) base.kategori = katQ;
    total = await prisma.respons.count({ where: base });
    list = await prisma.respons.findMany({ where: base, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { jawabanTerbuka: true } });
    if (q) {
      const qq = q.toLowerCase();
      list = list.filter((r: any) => JSON.stringify(r.identitas).toLowerCase().includes(qq));
    }
    if (fakultas) {
      list = list.filter((r: any) => String((r.identitas as any)?.fakultas ?? "").toLowerCase().includes(fakultas.toLowerCase()));
    }
  }
  res.json({ data: list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

// GET /api/respons/:id — admin detail + jawaban
responsRouter.get("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const r = await prisma.respons.findUnique({ where: { id: req.params.id }, include: { jawabanSkala: { include: { butirId: undefined } as any }, jawabanTerbuka: true } as any });
  if (!r) return res.status(404).json({ error: "Respons tidak ditemukan" });
  // enrich butir teks
  const skala = await prisma.jawabanSkala.findMany({ where: { responsId: r.id } });
  const butirIds = skala.map((s) => s.butirId);
  const butirs = await prisma.butir.findMany({ where: { id: { in: butirIds } } });
  const bmap = new Map(butirs.map((b) => [b.id, b]));
  const enriched = skala.map((s) => ({ ...s, butir: bmap.get(s.butirId) ?? null }));
  res.json({ ...r, jawabanSkala: enriched });
});

// POST /api/respons/:id/anulir — soft anulir
responsRouter.post("/:id/anulir", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const alasan = typeof req.body?.alasan === "string" ? req.body.alasan.trim() : "";
  if (!alasan) return res.status(400).json({ error: "Alasan anulir wajib" });
  const r = await prisma.respons.findUnique({ where: { id: req.params.id } });
  if (!r) return res.status(404).json({ error: "Respons tidak ditemukan" });
  if (r.status === "anulir") return res.status(409).json({ error: "Sudah dianulir" });
  const updated = await prisma.respons.update({ where: { id: r.id }, data: { status: "anulir", alasanAnulir: alasan } });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "respons.anulir", target: r.id, detail: { alasan } as any } });
  sseHub.broadcast("respons:anulir", { id: r.id, periodeId: r.periodeId }, r.periodeId);
  res.json(updated);
});

// DELETE /api/respons/:id — hard delete (admin bisa hapus penilaian responden)
responsRouter.delete("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const r = await prisma.respons.findUnique({ where: { id: req.params.id } });
  if (!r) return res.status(404).json({ error: "Tidak ditemukan" });
  await prisma.jawabanSkala.deleteMany({ where: { responsId: r.id } });
  await prisma.jawabanTerbuka.deleteMany({ where: { responsId: r.id } });
  await prisma.respons.delete({ where: { id: r.id } });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "respons.delete", target: r.id } });
  sseHub.broadcast("respons:deleted", { id: r.id, periodeId: r.periodeId }, r.periodeId);
  res.json({ ok: true });
});
