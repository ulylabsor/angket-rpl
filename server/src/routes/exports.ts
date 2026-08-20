import { Router } from "express";
import ExcelJS from "exceljs";
import { prisma } from "../utils/prisma.js";
import { auth } from "../middleware/auth.js";

export const exportRouter = Router();

// GET /api/exports/rekap/excel?periodeId=xxx
exportRouter.get("/rekap/excel", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const periodeIdQ = typeof req.query.periodeId === "string" ? req.query.periodeId : undefined;
  const periodeIds = periodeIdQ ? periodeIdQ.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  // reuse logic ringan — panggil /rekap internal
  const where: any = { status: { not: "anulir" } };
  if (periodeIds?.length) where.periodeId = { in: periodeIds };
  const respons = await prisma.respons.findMany({ where, select: { templateKode: true, nilaiInput: true, nilaiProses: true, nilaiOutput: true, nilaiAkhir: true } });

  // agregasi sama seperti rekap.ts (ringkas)
  const DIM: Record<string, string[]> = {
    UNIV: ["Input", "Proses", "Output"],
    FAK: ["Input", "Proses", "Output"],
    ASESOR: ["Input", "Proses Asesmen", "Output"],
    LPM: ["Input", "Proses", "Output"],
    SEK: ["Administrasi & Pelayanan"],
    MHS: ["Informasi & Pendaftaran", "Proses Asesmen", "Hasil Rekognisi"],
  };
  const LABEL: Record<string, string> = { UNIV: "Pengelola Universitas", FAK: "Fakultas/Pascasarjana", ASESOR: "Asesor", SEK: "Sekretariat", LPM: "LPM", MHS: "Mahasiswa/Pemohon" };
  const byTpl: Record<string, typeof respons> = {};
  for (const r of respons) (byTpl[r.templateKode] ??= []).push(r);
  const kat = (n: number | null) => n == null ? "-" : n >= 86 ? "Sangat Baik" : n >= 76 ? "Baik" : n >= 66 ? "Cukup" : n >= 51 ? "Kurang" : "Sangat Kurang";

  const wb = new ExcelJS.Workbook();
  wb.creator = "Monev RPL UIN Raden Fatah";
  // Sheet 1 — per dimensi
  const ws1 = wb.addWorksheet("Rekap per Dimensi");
  ws1.columns = [
    { header: "Responden", key: "responden", width: 28 },
    { header: "Dimensi", key: "dimensi", width: 28 },
    { header: "Jumlah Butir", key: "jumlahButir", width: 14 },
    { header: "Nilai Rata-rata", key: "nilaiAvg", width: 16 },
    { header: "Kategori", key: "kategori", width: 16 },
    { header: "Jumlah Respons", key: "jumlahRespons", width: 16 },
  ];
  ws1.getRow(1).font = { bold: true }; ws1.getRow(1).commit();
  for (const kode of ["UNIV", "FAK", "ASESOR", "SEK", "LPM", "MHS"] as const) {
    const dims = DIM[kode] ?? [];
    const list = byTpl[kode] ?? [];
    const colMap: Record<string, keyof typeof respons[0]> = dims.length === 1 ? { [dims[0]]: "nilaiInput" } : { [dims[0]]: "nilaiInput", [dims[1]]: "nilaiProses", [dims[2]]: "nilaiOutput" } as any;
    for (const dim of dims) {
      const col = colMap[dim];
      const vals = list.map((r: any) => r[col]).filter((v: any) => v != null) as number[];
      const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
      ws1.addRow({ responden: LABEL[kode], dimensi: dim, jumlahButir: DIM[kode].indexOf(dim) >= 0 ? ({ UNIV: { Input: 6, Proses: 8, Output: 4 }, FAK: { Input: 6, Proses: 9, Output: 6 }, ASESOR: { Input: 5, "Proses Asesmen": 14, Output: 6 }, LPM: { Input: 7, Proses: 11, Output: 8 }, SEK: { "Administrasi & Pelayanan": 10 }, MHS: { "Informasi & Pendaftaran": 5, "Proses Asesmen": 8, "Hasil Rekognisi": 7 } } as any)[kode]?.[dim] ?? "" : "", nilaiAvg: avg != null ? Math.round(avg * 100) / 100 : "-", kategori: kat(avg), jumlahRespons: list.length });
    }
  }
  // Sheet 2 — nilai akhir
  const ws2 = wb.addWorksheet("Rekap Nilai Akhir");
  ws2.columns = [
    { header: "Responden", key: "responden", width: 28 },
    { header: "Nilai Akhir (avg)", key: "nilaiAkhirAvg", width: 18 },
    { header: "Kategori", key: "kategori", width: 16 },
    { header: "Jumlah Respons", key: "jumlahRespons", width: 16 },
  ];
  ws2.getRow(1).font = { bold: true }; ws2.getRow(1).commit();
  let totalVals: number[] = [];
  for (const kode of ["UNIV", "FAK", "ASESOR", "SEK", "LPM", "MHS"] as const) {
    const list = byTpl[kode] ?? [];
    const vals = list.map((r: any) => r.nilaiAkhir).filter((v: any) => v != null) as number[];
    totalVals.push(...vals);
    const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
    ws2.addRow({ responden: LABEL[kode], nilaiAkhirAvg: avg != null ? Math.round(avg * 100) / 100 : "-", kategori: kat(avg), jumlahRespons: list.length });
  }
  const rataAll = totalVals.length ? totalVals.reduce((a, b) => a + b, 0) / totalVals.length : null;
  const row = ws2.addRow({ responden: "RATA-RATA (semua respons)", nilaiAkhirAvg: rataAll != null ? Math.round(rataAll * 100) / 100 : "-", kategori: kat(rataAll), jumlahRespons: totalVals.length });
  row.font = { bold: true }; row.commit();

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="rekap-${Date.now()}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

// GET /api/exports/respons/excel?periodeId=&templateKode=
exportRouter.get("/respons/excel", auth(["SUPER_ADMIN", "ADMIN_MONEV"]), async (req, res) => {
  const { periodeId, templateKode } = req.query as any;
  const where: any = { status: { not: "anulir" } };
  if (periodeId) where.periodeId = periodeId;
  if (templateKode) where.templateKode = String(templateKode).toUpperCase();
  const list = await prisma.respons.findMany({ where, orderBy: { createdAt: "asc" } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Respons");
  ws.columns = [
    { header: "Tanggal", key: "tgl", width: 18 },
    { header: "Periode", key: "periodeId", width: 22 },
    { header: "Angket", key: "templateKode", width: 10 },
    { header: "Nama", key: "nama", width: 22 },
    { header: "Fakultas", key: "fakultas", width: 22 },
    { header: "Prodi", key: "prodi", width: 22 },
    { header: "Kewarganegaraan", key: "kewarganegaraan", width: 22 },
    { header: "Asal Negara", key: "asalNegara", width: 18 },
    { header: "Nilai Akhir", key: "nilaiAkhir", width: 12 },
    { header: "Kategori", key: "kategori", width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of list) {
    const id: any = r.identitas as any;
    const kwRaw = String(id?.kewarganegaraan ?? "").trim();
    const kewarganegaraan = !kwRaw ? "" : (kwRaw.toUpperCase() === "WNA" || kwRaw.toUpperCase().includes("ASING") ? "Warga Negara Asing" : kwRaw.toUpperCase() === "WNI" || kwRaw.toUpperCase().includes("INDONESIA") ? "Warga Negara Indonesia" : kwRaw);
    const asalNegara = String(id?.negara ?? id?.asalNegara ?? id?.negaraAsal ?? "").trim();
    ws.addRow({ tgl: new Date(r.createdAt).toLocaleDateString("id-ID"), periodeId: r.periodeId.slice(0, 8), templateKode: r.templateKode, nama: id?.nama ?? "", fakultas: id?.fakultas ?? "", prodi: id?.prodi ?? "", kewarganegaraan, asalNegara, nilaiAkhir: r.nilaiAkhir ?? "", kategori: r.kategori ?? "" });
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="respons-${Date.now()}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});
