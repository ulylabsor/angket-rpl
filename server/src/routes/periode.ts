import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { auth } from "../middleware/auth.js";
import { sseHub } from "../utils/sse.js";

export const periodeRouter = Router();

// Publik: daftar periode aktif (untuk landing pilih periode)
periodeRouter.get("/", async (_req, res) => {
  const list = await prisma.periodeMonev.findMany({ orderBy: { tglMulai: "desc" } });
  res.json(list);
});

periodeRouter.get("/:id", async (req, res) => {
  const p = await prisma.periodeMonev.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).json({ error: "Periode tidak ditemukan" });
  res.json(p);
});

// Admin only
const periodeSchema = z.object({
  nama: z.string().min(3),
  tahun: z.number().int().min(2020).max(2100),
  tglMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tglSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["draft", "aktif", "tutup"]).default("draft"),
  deskripsi: z.string().optional().nullable(),
});

periodeRouter.post("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const parsed = periodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const created = await prisma.periodeMonev.create({ data: { nama: d.nama, tahun: d.tahun, tglMulai: new Date(d.tglMulai), tglSelesai: new Date(d.tglSelesai), status: d.status, deskripsi: d.deskripsi ?? null } });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "periode.create", target: created.id, detail: created as any } });
  sseHub.broadcast("periode:created", created);
  res.status(201).json(created);
});

periodeRouter.put("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const parsed = periodeSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d: any = { ...parsed.data };
  if (d.tglMulai) d.tglMulai = new Date(d.tglMulai);
  if (d.tglSelesai) d.tglSelesai = new Date(d.tglSelesai);
  const updated = await prisma.periodeMonev.update({ where: { id: req.params.id }, data: d });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "periode.update", target: updated.id, detail: updated as any } });
  sseHub.broadcast("periode:updated", updated);
  res.json(updated);
});

periodeRouter.delete("/:id", auth(["SUPER_ADMIN"]), async (req, res) => {
  const cnt = await prisma.respons.count({ where: { periodeId: req.params.id } });
  if (cnt > 0) return res.status(409).json({ error: `Periode memiliki ${cnt} respons, tidak dapat dihapus. Ubah status menjadi tutup.` });
  await prisma.periodeMonev.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({ data: { userId: (req as any).user.id, aksi: "periode.delete", target: req.params.id } });
  sseHub.broadcast("periode:deleted", { id: req.params.id });
  res.json({ ok: true });
});
