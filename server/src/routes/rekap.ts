import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { DIMENSI_BUTIR } from "../utils/scoring.js";
import { auth } from "../middleware/auth.js";

export const rekapRouter = Router();

// GET /api/rekap?periodeId=xxx  (&periodeId bisa multi comma)
rekapRouter.get("/", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const periodeIdQ = typeof req.query.periodeId === "string" ? req.query.periodeId : undefined;
  const periodeIds = periodeIdQ ? periodeIdQ.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  // Ambil respons non-anulir
  const where: any = { status: { not: "anulir" } };
  if (periodeIds?.length) where.periodeId = { in: periodeIds };

  const respons = await prisma.respons.findMany({ where, select: { templateKode: true, nilaiInput: true, nilaiProses: true, nilaiOutput: true, nilaiAkhir: true, kategori: true } });

  // Struktur hasil sesuai PRD §9.6
  // Rekap per Dimensi: rows { responden, dimensi, jumlahButir, nilaiAvg, kategori, jumlahRespons }
  // Rekap Nilai Akhir: rows { responden, nilaiAkhirAvg, kategori, tindakLanjut, jumlahRespons }

  const LABEL: Record<string, string> = {
    UNIV: "Pengelola Universitas",
    FAK: "Fakultas/Pascasarjana",
    ASESOR: "Asesor",
    SEK: "Sekretariat",
    LPM: "LPM",
    MHS: "Mahasiswa/Pemohon",
  };

  // group by templateKode
  const byTpl: Record<string, typeof respons> = {};
  for (const r of respons) (byTpl[r.templateKode] ??= []).push(r);

  // helper kategori
  const kat = (n: number | null) => {
    if (n == null) return null;
    if (n >= 86) return "Sangat Baik";
    if (n >= 76) return "Baik";
    if (n >= 66) return "Cukup";
    if (n >= 51) return "Kurang";
    return "Sangat Kurang";
  };

  const perDimensi: any[] = [];
  const perKelompok: any[] = [];

  const order = ["UNIV", "FAK", "ASESOR", "SEK", "LPM", "MHS"] as const;

  for (const kode of order) {
    const list = byTpl[kode] ?? [];
    const dims = DIMENSI_BUTIR[kode];
    if (!dims) continue;
    const dimNames = Object.keys(dims);
    // mapping kolom -> dimensi: Input->dimNames[0], Proses->dimNames[1], Output->dimNames[2]; untuk MHS/SEK sesuai urutan
    const colForDim: Record<string, keyof typeof respons[0]> = {};
    if (dimNames.length === 1) colForDim[dimNames[0]] = "nilaiInput" as any; // SEK single
    else {
      if (dimNames[0]) colForDim[dimNames[0]] = "nilaiInput";
      if (dimNames[1]) colForDim[dimNames[1]] = "nilaiProses";
      if (dimNames[2]) colForDim[dimNames[2]] = "nilaiOutput";
    }
    for (const dim of dimNames) {
      const col = colForDim[dim];
      const vals = list.map((r: any) => r[col]).filter((v: any) => v != null) as number[];
      const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
      perDimensi.push({
        responden: LABEL[kode] ?? kode,
        kode,
        dimensi: dim,
        jumlahButir: dims[dim],
        nilaiAvg: avg != null ? Math.round(avg * 100) / 100 : null,
        kategori: kat(avg),
        jumlahRespons: list.length,
      });
    }
    const akhirVals = list.map((r: any) => r.nilaiAkhir).filter((v: any) => v != null) as number[];
    const avgAkhir = akhirVals.length ? akhirVals.reduce((a: number, b: number) => a + b, 0) / akhirVals.length : null;
    perKelompok.push({
      responden: LABEL[kode] ?? kode,
      kode,
      nilaiAkhirAvg: avgAkhir != null ? Math.round(avgAkhir * 100) / 100 : null,
      kategori: kat(avgAkhir),
      jumlahRespons: list.length,
    });
  }

  // Baris Rata-rata (semua respons)
  const allAkhir = respons.map((r) => r.nilaiAkhir).filter((v) => v != null) as number[];
  const rataAll = allAkhir.length ? allAkhir.reduce((a, b) => a + b, 0) / allAkhir.length : null;
  const totalRespons = respons.length;

  res.json({
    perDimensi,
    perKelompok,
    ringkasan: { rataRataSemua: rataAll != null ? Math.round(rataAll * 100) / 100 : null, kategori: kat(rataAll), totalRespons },
    periodeIds: periodeIds ?? null,
  });
});
