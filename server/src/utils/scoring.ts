/** PRD §10.3 — verbatim */

export function nilaiDimensi(skorPerolehan: number, jumlahButir: number): number {
  return (skorPerolehan / (jumlahButir * 4)) * 100;
}

export function nilaiAkhir(nilaiPerDimensi: number[]): number {
  if (nilaiPerDimensi.length === 0) return 0;
  return nilaiPerDimensi.reduce((a, b) => a + b, 0) / nilaiPerDimensi.length;
}

export function kategori(nilai: number): { label: string; tindak: string } {
  if (nilai >= 86) return { label: "Sangat Baik", tindak: "Dipertahankan dan ditingkatkan" };
  if (nilai >= 76) return { label: "Baik", tindak: "Perbaikan minor" };
  if (nilai >= 66) return { label: "Cukup", tindak: "Perbaikan terencana" };
  if (nilai >= 51) return { label: "Kurang", tindak: "Tindakan korektif" };
  return { label: "Sangat Kurang", tindak: "Tindakan korektif segera" };
}

// Jumlah butir per (template, dimensi) — single source of truth
export const DIMENSI_BUTIR: Record<string, Record<string, number>> = {
  UNIV:   { Input: 6, Proses: 8, Output: 4 },
  FAK:    { Input: 6, Proses: 9, Output: 6 },
  ASESOR: { Input: 5, "Proses Asesmen": 14, Output: 6 },
  LPM:    { Input: 7, Proses: 11, Output: 8 },
  SEK:    { "Administrasi & Pelayanan": 10 },
  MHS: {
    "Informasi & Pendaftaran": 5,
    "Proses Asesmen": 8,
    "Hasil Rekognisi": 7,
  },
};

export function allDimensiFor(templateKode: string): string[] {
  return Object.keys(DIMENSI_BUTIR[templateKode] ?? {});
}

export function totalButirFor(templateKode: string): number {
  return Object.values(DIMENSI_BUTIR[templateKode] ?? {}).reduce((a, b) => a + b, 0);
}
