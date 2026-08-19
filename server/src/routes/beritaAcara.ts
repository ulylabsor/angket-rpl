import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { auth } from "../middleware/auth.js";

export const beritaAcaraRouter = Router();

const schema = z.object({
  periodeId: z.string().min(1),
  fakultas: z.string().optional().nullable(),
  prodi: z.string().optional().nullable(),
  tanggalBA: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nilai: z.number().optional().nullable(),
  kategori: z.string().optional().nullable(),
  temuanUtama: z.array(z.string()).max(10).optional().nullable(),
  rekomendasi: z.array(z.string()).max(10).optional().nullable(),
});

beritaAcaraRouter.get("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const { periodeId } = req.query as any;
  const where: any = {};
  if (periodeId) where.periodeId = periodeId;
  const list = await prisma.beritaAcara.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(list);
});

beritaAcaraRouter.post("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const d: any = { ...p.data, tanggalBA: new Date(p.data.tanggalBA) };
  const created = await prisma.beritaAcara.create({ data: d });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "ba.create", target: created.id, detail: created as any } });
  res.status(201).json(created);
});

beritaAcaraRouter.put("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = schema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const d: any = { ...p.data };
  if (d.tanggalBA) d.tanggalBA = new Date(d.tanggalBA);
  const updated = await prisma.beritaAcara.update({ where: { id: req.params.id }, data: d });
  res.json(updated);
});

beritaAcaraRouter.delete("/:id", auth(["SUPER_ADMIN"]), async (req, res) => {
  await prisma.beritaAcara.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

beritaAcaraRouter.get("/:id/pdf", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const ba = await prisma.beritaAcara.findUnique({ where: { id: req.params.id }, include: { periode: true } as any });
  if (!ba) return res.status(404).json({ error: "BA tidak ditemukan" });
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const draw = (text: string, x: number, y: number, size = 10, f = font, color = rgb(0.1, 0.1, 0.1)) =>
    page.drawText(text, { x, y, size, font: f, color });
  let y = 800;
  draw("BERITA ACARA MONEV RPL TIPE A", 150, y, 13, bold, rgb(0.06, 0.32, 0.2)); y -= 18;
  draw("UIN Raden Fatah Palembang", 210, y, 9, font, rgb(0.3, 0.3, 0.3)); y -= 22;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.77, 0.64, 0.32) }); y -= 18;
  const per = (ba as any).periode;
  draw(`Periode: ${per?.nama ?? ba.periodeId}  |  Tahun: ${per?.tahun ?? "-"}`, 40, y, 9); y -= 16;
  draw(`Fakultas: ${ba.fakultas ?? "-"}  |  Prodi: ${ba.prodi ?? "-"}`, 40, y, 9); y -= 16;
  draw(`Tanggal BA: ${new Date(ba.tanggalBA).toLocaleDateString("id-ID", { dateStyle: "long" })}`, 40, y, 9); y -= 16;
  if (ba.nilai != null) { draw(`Nilai: ${ba.nilai}  |  Kategori: ${ba.kategori ?? "-"}`, 40, y, 9); y -= 16; }
  y -= 8;
  draw("Temuan Utama:", 40, y, 10, bold); y -= 16;
  const temuan = (ba.temuanUtama as string[] | null) ?? [];
  for (let i = 0; i < Math.max(1, temuan.length); i++) { draw(`${i + 1}. ${temuan[i] ?? "-"}`, 50, y, 9); y -= 14; }
  y -= 8;
  draw("Rekomendasi:", 40, y, 10, bold); y -= 16;
  const rekom = (ba.rekomendasi as string[] | null) ?? [];
  for (let i = 0; i < Math.max(1, rekom.length); i++) { draw(`${i + 1}. ${rekom[i] ?? "-"}`, 50, y, 9); y -= 14; }
  y -= 24;
  draw("Catatan: Dokumen ini dicetak dari sistem Monev RPL. Tidak memerlukan tanda tangan basah.", 40, y, 7, font, rgb(0.5, 0.5, 0.5));
  const pdfBytes = await doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="BA-${ba.id.slice(0, 8)}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});
