import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { auth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const periodeId = typeof req.query.periodeId === "string" ? req.query.periodeId : undefined;

  const where: any = { status: { not: "anulir" } };
  if (periodeId) where.periodeId = periodeId;

  const [total, byKategori, byTemplate, latest] = await Promise.all([
    prisma.respons.count({ where }),
    prisma.respons.groupBy({ by: ["kategori"], where, _count: true }),
    prisma.respons.groupBy({ by: ["templateKode"], where, _count: true, _avg: { nilaiAkhir: true } }),
    prisma.respons.findMany({ where, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, templateKode: true, identitas: true, nilaiAkhir: true, kategori: true, createdAt: true } }),
  ]);

  // total per template label
  const templMap: Record<string, string> = { UNIV: "Universitas", FAK: "Fakultas", ASESOR: "Asesor", LPM: "LPM", SEK: "Sekretariat", MHS: "Mahasiswa" };

  res.json({
    total,
    byKategori: byKategori.map((g) => ({ kategori: g.kategori ?? "—", count: g._count })),
    byTemplate: byTemplate.map((g) => ({ kode: g.templateKode, label: templMap[g.templateKode] ?? g.templateKode, count: g._count, avgNilai: g._avg.nilaiAkhir != null ? Math.round((g._avg.nilaiAkhir as number) * 100) / 100 : null })),
    latest,
  });
});
