import { Router } from "express";
import { prisma } from "../utils/prisma.js";

export const masterRouter = Router();

masterRouter.get("/fakultas", async (_req, res) => {
  const list = await prisma.fakultas.findMany({ orderBy: { nama: "asc" }, include: { prodi: { orderBy: { nama: "asc" } } } });
  res.json(list);
});

masterRouter.get("/prodi", async (req, res) => {
  const { fakultasId } = req.query as any;
  const where: any = {};
  if (fakultasId) where.fakultasId = fakultasId;
  const list = await prisma.prodi.findMany({ where, orderBy: { nama: "asc" } });
  res.json(list);
});
