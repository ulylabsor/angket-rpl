import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { auth } from "../middleware/auth.js";
import { sseHub } from "../utils/sse.js";

export const temuanRouter = Router();

const schema = z.object({
  periodeId: z.string().min(1),
  unit: z.string().optional().nullable(),
  temuan: z.string().min(3),
  bukti: z.string().optional().nullable(),
  kategori: z.enum(["Mayor", "Minor", "Observasi"]),
  akarMasalah: z.string().optional().nullable(),
  rekomendasi: z.string().optional().nullable(),
});

temuanRouter.get("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const { periodeId } = req.query as any;
  const where: any = {};
  if (periodeId) where.periodeId = periodeId;
  const list = await prisma.temuan.findMany({ where, orderBy: { createdAt: "desc" }, include: { rtl: true } });
  res.json(list);
});

temuanRouter.post("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.temuan.create({ data: p.data as any });
  sseHub.broadcast("temuan:created", created, created.periodeId);
  res.status(201).json(created);
});

temuanRouter.put("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = schema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.temuan.update({ where: { id: req.params.id }, data: p.data as any });
  sseHub.broadcast("temuan:updated", updated, updated.periodeId);
  res.json(updated);
});

temuanRouter.delete("/:id", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const t = await prisma.temuan.findUnique({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: "Tidak ditemukan" });
  await prisma.rTL.deleteMany({ where: { temuanId: t.id } });
  await prisma.temuan.delete({ where: { id: t.id } });
  sseHub.broadcast("temuan:deleted", { id: t.id, periodeId: t.periodeId }, t.periodeId);
  res.json({ ok: true });
});

// â”€â”€ RTL nested â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const rtlSchema = z.object({
  programPerbaikan: z.string().min(3),
  pic: z.string().min(1),
  tglMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  tglSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  indikatorKeberhasilan: z.string().optional().nullable(),
  status: z.enum(["Belum", "Proses", "Selesai", "Tertunda"]).default("Belum"),
});

temuanRouter.get("/:temuanId/rtl", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const list = await prisma.rTL.findMany({ where: { temuanId: req.params.temuanId }, orderBy: { createdAt: "asc" } });
  res.json(list);
});

temuanRouter.post("/:temuanId/rtl", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = rtlSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const temu = await prisma.temuan.findUnique({ where: { id: req.params.temuanId } });
  if (!temu) return res.status(404).json({ error: "Temuan tidak ditemukan" });
  const d: any = { ...p.data, temuanId: temu.id };
  if (d.tglMulai) d.tglMulai = new Date(d.tglMulai);
  if (d.tglSelesai) d.tglSelesai = new Date(d.tglSelesai);
  const created = await prisma.rTL.create({ data: d });
  sseHub.broadcast("rtl:created", created, temu.periodeId);
  res.status(201).json(created);
});

temuanRouter.put("/:temuanId/rtl/:rtlId", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const p = rtlSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const d: any = { ...p.data };
  if (d.tglMulai) d.tglMulai = new Date(d.tglMulai);
  if (d.tglSelesai) d.tglSelesai = new Date(d.tglSelesai);
  const updated = await prisma.rTL.update({ where: { id: req.params.rtlId }, data: d });
  const temu = await prisma.temuan.findUnique({ where: { id: req.params.temuanId } });
  sseHub.broadcast("rtl:updated", updated, temu?.periodeId);
  res.json(updated);
});

temuanRouter.delete("/:temuanId/rtl/:rtlId", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  await prisma.rTL.delete({ where: { id: req.params.rtlId } });
  const temu = await prisma.temuan.findUnique({ where: { id: req.params.temuanId } });
  sseHub.broadcast("rtl:deleted", { id: req.params.rtlId, temuanId: req.params.temuanId, periodeId: temu?.periodeId }, temu?.periodeId);
  res.json({ ok: true });
});
