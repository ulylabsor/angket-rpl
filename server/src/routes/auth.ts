import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Email atau password salah" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Email atau password salah" });
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" } as any);
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 3600 * 1000, path: "/" });
  res.json({ token, user: { id: user.id, email: user.email, nama: user.nama, role: user.role } });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = (req as any).cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ id: user.id, email: user.email, nama: user.nama, role: user.role });
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
});
