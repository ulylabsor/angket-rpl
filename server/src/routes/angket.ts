import { Router } from "express";
import { prisma } from "../utils/prisma.js";

export const angketRouter = Router();

const LABEL: Record<string, string> = {
  UNIV: "Pengelola RPL Universitas",
  FAK: "Pengelola RPL Fakultas/Pascasarjana/Prodi",
  ASESOR: "Asesor RPL",
  LPM: "LPM",
  SEK: "Sekretariat / Pengelola Administrasi",
  MHS: "Pemohon / Mahasiswa RPL",
};

// GET /api/angket — daftar 6 template + jumlah butir
angketRouter.get("/", async (_req, res) => {
  const templates = await prisma.angketTemplate.findMany({ orderBy: { kode: "asc" } });
  const counts = await prisma.butir.groupBy({ by: ["templateId"], _count: true, where: { aktif: true } });
  const map = new Map(counts.map((c) => [c.templateId, c._count]));
  res.json(templates.map((t) => ({ ...t, label: LABEL[t.kode] ?? t.nama, butirCount: map.get(t.kode) ?? 0 })));
});

// GET /api/angket/:kode — detail + butir grouped by dimensi (urut)
angketRouter.get("/:kode", async (req, res) => {
  const kode = req.params.kode.toUpperCase();
  const tpl = await prisma.angketTemplate.findUnique({ where: { kode } });
  if (!tpl) return res.status(404).json({ error: "Angket tidak ditemukan" });
  const butir = await prisma.butir.findMany({ where: { templateId: kode, aktif: true }, orderBy: { urut: "asc" } });
  // group by dimensi preserving urut
  const dimensiOrder: string[] = [];
  const grouped: Record<string, typeof butir> = {};
  for (const b of butir) {
    if (!grouped[b.dimensi]) { grouped[b.dimensi] = []; dimensiOrder.push(b.dimensi); }
    grouped[b.dimensi].push(b);
  }
  res.json({ template: { ...tpl, label: LABEL[kode] ?? tpl.nama }, dimensiOrder, grouped, butir });
});
