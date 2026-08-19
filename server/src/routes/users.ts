import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { auth, type AuthedRequest } from "../middleware/auth.js";

export const usersRouter = Router();

const DEFAULT_PASSWORD = "123";

// Semua route butuh login admin
usersRouter.use(auth(["SUPER_ADMIN", "ADMIN_MONEV"]));

// GET /api/users — daftar pengguna (tanpa hash password)
usersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, nama: true, role: true, createdAt: true },
  });
  res.json(users);
});

// POST /api/users — tambah pengguna; password kosong -> default 123
const createSchema = z.object({
  email: z.string().email(),
  nama: z.string().min(2),
  role: z.enum(["SUPER_ADMIN", "ADMIN_MONEV"]),
  password: z.string().min(1).optional().nullable(),
});

usersRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, nama, role, password } = parsed.data;
  const me = (req as AuthedRequest).user!;

  // ADMIN_MONEV tidak boleh membuat SUPER_ADMIN
  if (me.role === "ADMIN_MONEV" && role === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Hanya Super Admin yang dapat membuat akun Super Admin." });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email sudah terdaftar." });

  const plain = password?.trim() ? password.trim() : DEFAULT_PASSWORD;
  const hash = await bcrypt.hash(plain, 10);
  const created = await prisma.user.create({ data: { email, nama, role, password: hash } });
  await prisma.auditLog.create({ data: { userId: me.id, aksi: "user.create", target: created.id, detail: { email, role } as any } });
  res.status(201).json({ id: created.id, email: created.email, nama: created.nama, role: created.role, createdAt: created.createdAt });
});

// PUT /api/users/:id — ubah nama / email / role
const updateSchema = z.object({
  email: z.string().email().optional(),
  nama: z.string().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN_MONEV"]).optional(),
});

usersRouter.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const me = (req as AuthedRequest).user!;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Pengguna tidak ditemukan." });

  // ADMIN_MONEV tidak boleh ubah role menjadi SUPER_ADMIN atau mengubah akun SUPER_ADMIN
  if (me.role === "ADMIN_MONEV" && (target.role === "SUPER_ADMIN" || parsed.data.role === "SUPER_ADMIN")) {
    return res.status(403).json({ error: "Hanya Super Admin yang dapat mengelola akun Super Admin." });
  }

  if (parsed.data.email && parsed.data.email !== target.email) {
    const dup = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (dup) return res.status(409).json({ error: "Email sudah dipakai akun lain." });
  }

  const updated = await prisma.user.update({ where: { id: req.params.id }, data: parsed.data as any });
  await prisma.auditLog.create({ data: { userId: me.id, aksi: "user.update", target: updated.id, detail: parsed.data as any } });
  res.json({ id: updated.id, email: updated.email, nama: updated.nama, role: updated.role, createdAt: updated.createdAt });
});

// PATCH /api/users/:id/reset-password — reset ke default 123 atau password kustom
const resetSchema = z.object({ password: z.string().min(1).optional().nullable() });

usersRouter.patch("/:id/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const me = (req as AuthedRequest).user!;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  if (me.role === "ADMIN_MONEV" && target.role === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Hanya Super Admin yang dapat mereset password Super Admin." });
  }
  const plain = parsed.data.password?.trim() ? parsed.data.password.trim() : DEFAULT_PASSWORD;
  const hash = await bcrypt.hash(plain, 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { password: hash } });
  await prisma.auditLog.create({ data: { userId: me.id, aksi: "user.reset-password", target: target.id } });
  res.json({ ok: true, message: `Password direset ke "${plain}".` });
});

// DELETE /api/users/:id
usersRouter.delete("/:id", async (req, res) => {
  const me = (req as AuthedRequest).user!;
  if (me.id === req.params.id) return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri." });
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  if (me.role === "ADMIN_MONEV" && target.role === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Hanya Super Admin yang dapat menghapus akun Super Admin." });
  }
  // cegah hapus SUPER_ADMIN terakhir
  if (target.role === "SUPER_ADMIN") {
    const superCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) return res.status(409).json({ error: "Tidak dapat menghapus Super Admin terakhir." });
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({ data: { userId: me.id, aksi: "user.delete", target: target.id, detail: { email: target.email } as any } });
  res.json({ ok: true });
});
