import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────
const tpl = (kode: string, nama: string) => ({ kode, nama });

// 120 butir verbatim dari Pedoman (T7..T22), nomor per template 1..n, urut global
type RawButir = { templateId: string; dimensi: string; nomor: number; urut: number; teks: string };

const BUTIR: RawButir[] = [
  // ── UNIV (18) ──────────────────────────────────────────
  // Input 6 (T7)
  { templateId: "UNIV", dimensi: "Input", nomor: 1, urut: 1, teks: "Universitas telah memiliki pedoman penyelenggaraan RPL Tipe A yang menjadi acuan pelaksanaan." },
  { templateId: "UNIV", dimensi: "Input", nomor: 2, urut: 2, teks: "Pengelola RPL Universitas telah ditetapkan melalui Surat Keputusan Rektor." },
  { templateId: "UNIV", dimensi: "Input", nomor: 3, urut: 3, teks: "Tugas dan kewenangan Pengelola RPL Universitas telah ditetapkan secara jelas." },
  { templateId: "UNIV", dimensi: "Input", nomor: 4, urut: 4, teks: "Tersedia mekanisme pendaftaran calon mahasiswa melalui jalur RPL." },
  { templateId: "UNIV", dimensi: "Input", nomor: 5, urut: 5, teks: "Tersedia sistem informasi yang mendukung penyelenggaraan RPL." },
  { templateId: "UNIV", dimensi: "Input", nomor: 6, urut: 6, teks: "Tersedia mekanisme koordinasi antara pengelola RPL Universitas dengan Fakultas/Pascasarjana." },
  // Proses 8 (T8)
  { templateId: "UNIV", dimensi: "Proses", nomor: 7, urut: 7, teks: "Informasi RPL diberikan kepada calon mahasiswa secara jelas." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 8, urut: 8, teks: "Calon mahasiswa memperoleh informasi mengenai persyaratan dokumen RPL." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 9, urut: 9, teks: "Proses pendaftaran dilaksanakan sesuai pedoman." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 10, urut: 10, teks: "Pengelola berkoordinasi dengan Fakultas/Pascasarjana dalam pendaftaran." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 11, urut: 11, teks: "Dokumen calon mahasiswa diteruskan kepada unit berwenang." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 12, urut: 12, teks: "Pengelolaan data calon mahasiswa RPL dilakukan tertib dan terdokumentasi." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 13, urut: 13, teks: "Penetapan mahasiswa baru jalur RPL dilakukan sesuai mekanisme." },
  { templateId: "UNIV", dimensi: "Proses", nomor: 14, urut: 14, teks: "Hasil penetapan mahasiswa RPL dicatat dalam sistem informasi." },
  // Output 4 (T9)
  { templateId: "UNIV", dimensi: "Output", nomor: 15, urut: 15, teks: "Tersedia data mahasiswa yang diterima melalui jalur RPL." },
  { templateId: "UNIV", dimensi: "Output", nomor: 16, urut: 16, teks: "Tersedia dokumen penetapan mahasiswa baru jalur RPL." },
  { templateId: "UNIV", dimensi: "Output", nomor: 17, urut: 17, teks: "Hasil rekognisi pembelajaran lampau terdokumentasi dengan baik." },
  { templateId: "UNIV", dimensi: "Output", nomor: 18, urut: 18, teks: "Data hasil RPL dapat ditelusuri kembali apabila diperlukan." },

  // ── FAK (21) ───────────────────────────────────────────
  // Input 6 (T10)
  { templateId: "FAK", dimensi: "Input", nomor: 1, urut: 19, teks: "Program Studi telah ditetapkan sebagai penyelenggara RPL sesuai ketentuan." },
  { templateId: "FAK", dimensi: "Input", nomor: 2, urut: 20, teks: "Tersedia informasi profil Program Studi bagi calon mahasiswa RPL." },
  { templateId: "FAK", dimensi: "Input", nomor: 3, urut: 21, teks: "Tersedia daftar mata kuliah yang dapat direkognisi." },
  { templateId: "FAK", dimensi: "Input", nomor: 4, urut: 22, teks: "CPMK setiap mata kuliah objek rekognisi tersedia dan terdokumentasi." },
  { templateId: "FAK", dimensi: "Input", nomor: 5, urut: 23, teks: "Pengelola RPL Fakultas/Pascasarjana telah ditetapkan dengan jelas." },
  { templateId: "FAK", dimensi: "Input", nomor: 6, urut: 24, teks: "Tersedia perangkat administrasi dan formulir pelaksanaan RPL." },
  // Proses 9 (T11)
  { templateId: "FAK", dimensi: "Proses", nomor: 7, urut: 25, teks: "Pemohon mendapatkan konsultasi mengenai pilihan Program Studi RPL." },
  { templateId: "FAK", dimensi: "Proses", nomor: 8, urut: 26, teks: "Pemohon memperoleh penjelasan mengenai persyaratan dan bukti yang harus disiapkan." },
  { templateId: "FAK", dimensi: "Proses", nomor: 9, urut: 27, teks: "Kelengkapan dokumen pemohon diperiksa sebelum asesmen." },
  { templateId: "FAK", dimensi: "Proses", nomor: 10, urut: 28, teks: "Portofolio pemohon dikelola dan didokumentasikan dengan baik." },
  { templateId: "FAK", dimensi: "Proses", nomor: 11, urut: 29, teks: "Pengelola membantu pemohon mengidentifikasi pembelajaran yang dapat direkognisi." },
  { templateId: "FAK", dimensi: "Proses", nomor: 12, urut: 30, teks: "Koordinasi pengelola dan asesor berjalan baik." },
  { templateId: "FAK", dimensi: "Proses", nomor: 13, urut: 31, teks: "Proses asesmen dilaksanakan sesuai jadwal dan prosedur." },
  { templateId: "FAK", dimensi: "Proses", nomor: 14, urut: 32, teks: "Hasil asesmen diterima dan didokumentasikan." },
  { templateId: "FAK", dimensi: "Proses", nomor: 15, urut: 33, teks: "Pengelola mengajukan penetapan hasil RPL kepada pimpinan Fakultas/Pascasarjana." },
  // Output 6 (T12)
  { templateId: "FAK", dimensi: "Output", nomor: 16, urut: 34, teks: "Setiap pemohon memiliki hasil asesmen RPL terdokumentasi." },
  { templateId: "FAK", dimensi: "Output", nomor: 17, urut: 35, teks: "Mata kuliah dan SKS yang direkognisi ditetapkan berdasarkan hasil asesmen." },
  { templateId: "FAK", dimensi: "Output", nomor: 18, urut: 36, teks: "Tersedia berita acara hasil asesmen RPL." },
  { templateId: "FAK", dimensi: "Output", nomor: 19, urut: 37, teks: "Tersedia SK Dekan/Direktur tentang pengakuan capaian pembelajaran." },
  { templateId: "FAK", dimensi: "Output", nomor: 20, urut: 38, teks: "Mahasiswa mengetahui mata kuliah dan SKS yang direkognisi." },
  { templateId: "FAK", dimensi: "Output", nomor: 21, urut: 39, teks: "Mahasiswa mengetahui mata kuliah yang masih harus ditempuh." },

  // ── ASESOR (25) ────────────────────────────────────────
  // Input 5 (T13)
  { templateId: "ASESOR", dimensi: "Input", nomor: 1, urut: 40, teks: "Saya memperoleh penugasan sebagai asesor RPL melalui mekanisme yang ditetapkan." },
  { templateId: "ASESOR", dimensi: "Input", nomor: 2, urut: 41, teks: "Bidang keahlian saya sesuai dengan bidang keilmuan/CPMK yang dinilai." },
  { templateId: "ASESOR", dimensi: "Input", nomor: 3, urut: 42, teks: "Instrumen asesmen RPL tersedia sebelum asesmen." },
  { templateId: "ASESOR", dimensi: "Input", nomor: 4, urut: 43, teks: "Kriteria penilaian ditetapkan sebelum asesmen." },
  { templateId: "ASESOR", dimensi: "Input", nomor: 5, urut: 44, teks: "Informasi CPMK mata kuliah tersedia dengan jelas." },
  // Proses Asesmen 14 (T14)
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 6, urut: 45, teks: "Dokumen/portofolio pemohon diperiksa sistematis." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 7, urut: 46, teks: "Bukti portofolio diverifikasi berdasarkan keabsahan dan relevansinya." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 8, urut: 47, teks: "Bukti diperiksa berdasarkan prinsip valid, autentik, terkini, dan memadai." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 9, urut: 48, teks: "Asesmen mandiri digunakan sebagai bahan pertimbangan." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 10, urut: 49, teks: "Wawancara dilakukan untuk memperdalam kompetensi pemohon." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 11, urut: 50, teks: "Asesmen tertulis/lisan dilakukan apabila diperlukan." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 12, urut: 51, teks: "Demonstrasi/unjuk kerja dilakukan apabila diperlukan." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 13, urut: 52, teks: "Metode asesmen disesuaikan dengan kompetensi." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 14, urut: 53, teks: "Penilaian didasarkan pada ketercapaian CPMK." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 15, urut: 54, teks: "Asesmen dilakukan objektif dan tidak diskriminatif." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 16, urut: 55, teks: "Kerahasiaan dokumen dan hasil asesmen dijaga." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 17, urut: 56, teks: "Hasil penilaian dapat dipertanggungjawabkan secara akademik." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 18, urut: 57, teks: "Asesor 1 dan 2 membahas hasil asesmen." },
  { templateId: "ASESOR", dimensi: "Proses Asesmen", nomor: 19, urut: 58, teks: "Hasil asesmen disepakati antarasesor." },
  // Output 6 (T15)
  { templateId: "ASESOR", dimensi: "Output", nomor: 20, urut: 59, teks: "Hasil asesmen setiap pemohon dituangkan dalam dokumen hasil asesmen." },
  { templateId: "ASESOR", dimensi: "Output", nomor: 21, urut: 60, teks: "Mata kuliah yang direkognisi ditentukan berdasarkan capaian pembelajaran yang terbukti." },
  { templateId: "ASESOR", dimensi: "Output", nomor: 22, urut: 61, teks: "Jumlah SKS yang direkognisi ditentukan berdasarkan hasil asesmen." },
  { templateId: "ASESOR", dimensi: "Output", nomor: 23, urut: 62, teks: "Hasil asesmen disampaikan kepada pengelola RPL Fakultas/Pascasarjana." },
  { templateId: "ASESOR", dimensi: "Output", nomor: 24, urut: 63, teks: "Berita acara asesmen dibuat dan ditandatangani asesor." },
  { templateId: "ASESOR", dimensi: "Output", nomor: 25, urut: 64, teks: "Hasil asesmen dapat ditelusuri berdasarkan bukti yang digunakan." },

  // ── LPM (26) ───────────────────────────────────────────
  // Input 7 (T16)
  { templateId: "LPM", dimensi: "Input", nomor: 1, urut: 65, teks: "Terdapat dasar hukum dan pedoman penyelenggaraan RPL." },
  { templateId: "LPM", dimensi: "Input", nomor: 2, urut: 66, teks: "Pengelola RPL Universitas telah ditetapkan melalui SK." },
  { templateId: "LPM", dimensi: "Input", nomor: 3, urut: 67, teks: "Pengelola RPL Fakultas/Pascasarjana telah ditetapkan." },
  { templateId: "LPM", dimensi: "Input", nomor: 4, urut: 68, teks: "Asesor RPL telah ditetapkan dan memiliki kompetensi sesuai." },
  { templateId: "LPM", dimensi: "Input", nomor: 5, urut: 69, teks: "Program Studi memiliki kurikulum dan CPMK untuk rekognisi." },
  { templateId: "LPM", dimensi: "Input", nomor: 6, urut: 70, teks: "Perangkat asesmen RPL tersedia dan memadai." },
  { templateId: "LPM", dimensi: "Input", nomor: 7, urut: 71, teks: "Sistem dokumentasi dan informasi RPL tersedia." },
  // Proses 11 (T17)
  { templateId: "LPM", dimensi: "Proses", nomor: 8, urut: 72, teks: "Pendaftaran RPL dilaksanakan sesuai pedoman." },
  { templateId: "LPM", dimensi: "Proses", nomor: 9, urut: 73, teks: "Konsultasi calon mahasiswa dilaksanakan dengan baik." },
  { templateId: "LPM", dimensi: "Proses", nomor: 10, urut: 74, teks: "Kelengkapan dokumen diverifikasi." },
  { templateId: "LPM", dimensi: "Proses", nomor: 11, urut: 75, teks: "Portofolio diverifikasi dan divalidasi." },
  { templateId: "LPM", dimensi: "Proses", nomor: 12, urut: 76, teks: "Asesmen dilaksanakan asesor sesuai bidang keahlian." },
  { templateId: "LPM", dimensi: "Proses", nomor: 13, urut: 77, teks: "Metode asesmen sesuai kompetensi/CPMK." },
  { templateId: "LPM", dimensi: "Proses", nomor: 14, urut: 78, teks: "Asesmen menjamin objektivitas dan keadilan." },
  { templateId: "LPM", dimensi: "Proses", nomor: 15, urut: 79, teks: "Kerahasiaan data pemohon dijaga." },
  { templateId: "LPM", dimensi: "Proses", nomor: 16, urut: 80, teks: "Hasil asesmen disepakati asesor." },
  { templateId: "LPM", dimensi: "Proses", nomor: 17, urut: 81, teks: "Hasil asesmen didokumentasikan dalam berita acara." },
  { templateId: "LPM", dimensi: "Proses", nomor: 18, urut: 82, teks: "Penetapan hasil rekognisi sesuai kewenangan." },
  // Output 8 (T18)
  { templateId: "LPM", dimensi: "Output", nomor: 19, urut: 83, teks: "Hasil asesmen setiap pemohon terdokumentasi." },
  { templateId: "LPM", dimensi: "Output", nomor: 20, urut: 84, teks: "Mata kuliah dan SKS ditetapkan berdasarkan asesmen." },
  { templateId: "LPM", dimensi: "Output", nomor: 21, urut: 85, teks: "Tersedia SK Dekan/Direktur tentang pengakuan hasil RPL." },
  { templateId: "LPM", dimensi: "Output", nomor: 22, urut: 86, teks: "Tersedia SK Rektor tentang penetapan mahasiswa baru RPL." },
  { templateId: "LPM", dimensi: "Output", nomor: 23, urut: 87, teks: "Hasil RPL tercatat dalam dokumen akademik mahasiswa." },
  { templateId: "LPM", dimensi: "Output", nomor: 24, urut: 88, teks: "Mata kuliah yang masih harus ditempuh ditetapkan jelas." },
  { templateId: "LPM", dimensi: "Output", nomor: 25, urut: 89, teks: "Data hasil RPL dicatat/diunggah pada sistem." },
  { templateId: "LPM", dimensi: "Output", nomor: 26, urut: 90, teks: "Terdapat tindak lanjut atas hasil Monev." },

  // ── SEK (10) ───────────────────────────────────────────
  // Administrasi & Pelayanan 10 (T19) — SATU dimensi
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 1, urut: 91, teks: "Informasi administrasi RPL tersedia dan mudah diberikan kepada pemohon." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 2, urut: 92, teks: "Dokumen pendaftaran diterima dan dicatat dengan baik." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 3, urut: 93, teks: "Kelengkapan dokumen diperiksa menggunakan checklist." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 4, urut: 94, teks: "Dokumen portofolio disimpan tertib." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 5, urut: 95, teks: "Dokumen pemohon dijaga kerahasiaannya." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 6, urut: 96, teks: "Dokumen asesmen diterima dan disimpan tertib." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 7, urut: 97, teks: "Berita acara asesmen terdokumentasi dengan baik." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 8, urut: 98, teks: "SK pengakuan hasil RPL terdokumentasi." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 9, urut: 99, teks: "Data mahasiswa RPL diperbarui dalam sistem informasi." },
  { templateId: "SEK", dimensi: "Administrasi & Pelayanan", nomor: 10, urut: 100, teks: "Pelayanan administrasi diberikan cepat, tepat, dan transparan." },

  // ── MHS (20) ───────────────────────────────────────────
  // Informasi & Pendaftaran 5 (T20)
  { templateId: "MHS", dimensi: "Informasi & Pendaftaran", nomor: 1, urut: 101, teks: "Saya memperoleh informasi RPL dengan jelas." },
  { templateId: "MHS", dimensi: "Informasi & Pendaftaran", nomor: 2, urut: 102, teks: "Persyaratan pendaftaran RPL dijelaskan dengan jelas." },
  { templateId: "MHS", dimensi: "Informasi & Pendaftaran", nomor: 3, urut: 103, teks: "Prosedur pendaftaran RPL mudah dipahami." },
  { templateId: "MHS", dimensi: "Informasi & Pendaftaran", nomor: 4, urut: 104, teks: "Saya memperoleh kesempatan berkonsultasi mengenai pilihan Program Studi." },
  { templateId: "MHS", dimensi: "Informasi & Pendaftaran", nomor: 5, urut: 105, teks: "Pengelola membantu memahami dokumen/bukti yang harus disiapkan." },
  // Proses Asesmen 8 (T21)
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 6, urut: 106, teks: "Pemeriksaan dokumen/portofolio dilakukan dengan jelas." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 7, urut: 107, teks: "Saya memperoleh penjelasan mengenai proses asesmen." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 8, urut: 108, teks: "Asesor melaksanakan asesmen secara objektif." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 9, urut: 109, teks: "Asesor memberi kesempatan menjelaskan pengalaman belajar/kerja." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 10, urut: 110, teks: "Wawancara/tes/demonstrasi sesuai kompetensi yang saya ajukan." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 11, urut: 111, teks: "Proses asesmen transparan." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 12, urut: 112, teks: "Saya diperlakukan secara adil." },
  { templateId: "MHS", dimensi: "Proses Asesmen", nomor: 13, urut: 113, teks: "Kerahasiaan data dan dokumen saya dijaga." },
  // Hasil Rekognisi 7 (T22)
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 14, urut: 114, teks: "Hasil asesmen disampaikan dengan jelas." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 15, urut: 115, teks: "Mata kuliah yang diakui dijelaskan kepada saya." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 16, urut: 116, teks: "Jumlah SKS yang direkognisi dijelaskan." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 17, urut: 117, teks: "Mata kuliah yang masih harus ditempuh dijelaskan." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 18, urut: 118, teks: "Saya menerima dokumen/keputusan hasil rekognisi." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 19, urut: 119, teks: "Proses RPL sesuai informasi yang diberikan sebelumnya." },
  { templateId: "MHS", dimensi: "Hasil Rekognisi", nomor: 20, urut: 120, teks: "Secara keseluruhan saya puas terhadap pelayanan RPL." },
];

const FAKULTAS_SEED: { nama: string; kode: string; prodi: string[] }[] = [
  { nama: "Pascasarjana", kode: "PPS", prodi: ["S3 Pendidikan Agama Islam", "S3 Peradaban Islam", "S2 Studi Islam", "S2 Pendidikan Agama Islam", "S2 Manajemen Pendidikan Islam"] },
  { nama: "Fakultas Ilmu Tarbiyah dan Keguruan", kode: "FITK", prodi: ["S1 Pendidikan Agama Islam","S1 Manajemen Pendidikan Islam","S1 Pendidikan Bahasa Inggris","S1 Pendidikan Guru Madrasah Ibtidaiyah","S1 Pendidikan Bahasa Arab","S1 Pendidikan Biologi","S1 Pendidikan Matematika","S1 Pendidikan Fisika","S1 Pendidikan Islam Anak Usia Dini","S1 Pendidikan Kimia","S1 Pendidikan Profesi Guru"] },
  { nama: "Fakultas Psikologi", kode: "FPSI", prodi: ["S1 Psikologi"] },
  { nama: "Fakultas Dakwah dan Komunikasi", kode: "FDK", prodi: ["S1 Manajemen Dakwah","S1 Jurnalistik","S1 Komunikasi dan Penyiaran Islam","S1 Bimbingan Penyuluhan Islam","S1 Pengembangan Masyarakat Islam"] },
  { nama: "Fakultas Sains dan Teknologi", kode: "FST", prodi: ["S1 Kimia","S1 Sistem Informasi","S1 Biologi"] },
  { nama: "Fakultas Syariah dan Hukum", kode: "FSH", prodi: ["S1 Hukum Keluarga Islam","S1 Hukum Ekonomi Syariah","S1 Hukum Tata Negara"] },
  { nama: "Fakultas Ekonomi dan Bisnis Islam", kode: "FEBI", prodi: ["S2 Ekonomi Syariah","S1 Ekonomi Syariah","S1 Perbankan Syariah","S1 Manajemen Zakat dan Wakaf"] },
  { nama: "Fakultas Adab dan Humaniora", kode: "FAH", prodi: ["S1 Sejarah Peradaban Islam","S1 Ilmu Perpustakaan","S1 Bahasa dan Sastra Arab"] },
  { nama: "Fakultas Ushuluddin dan Pemikiran Islam", kode: "FUPI", prodi: ["S2 Ilmu Al-Quran dan Tafsir","S1 Ilmu Al-Quran dan Tafsir","S1 Ilmu Hadis","S1 Aqidah dan Filsafat Islam","S1 Studi Agama-Agama"] },
];

async function main() {
  console.log("Seeding Fakultas & Prodi ...");
  for (const f of FAKULTAS_SEED) {
    const fak = await prisma.fakultas.upsert({
      where: { nama: f.nama },
      update: { kode: f.kode },
      create: { nama: f.nama, kode: f.kode },
    });
    for (const namaProdi of f.prodi) {
      await prisma.prodi.upsert({
        where: { nama_fakultasId: { nama: namaProdi, fakultasId: fak.id } } as any,
        update: {},
        create: { nama: namaProdi, fakultasId: fak.id },
      }).catch(async () => {
        const exists = await prisma.prodi.findFirst({ where: { nama: namaProdi, fakultasId: fak.id } });
        if (!exists) await prisma.prodi.create({ data: { nama: namaProdi, fakultasId: fak.id } });
      });
    }
  }
  // fallback generic prodi upsert tanpa composite unique yang tricky
  console.log("Fakultas seeded:", FAKULTAS_SEED.length);

  console.log("Seeding AngketTemplate ...");
  const templates = [
    tpl("UNIV", "Pengelola RPL Universitas"),
    tpl("FAK", "Pengelola RPL Fakultas/Pascasarjana/Prodi"),
    tpl("ASESOR", "Asesor RPL"),
    tpl("LPM", "LPM"),
    tpl("SEK", "Sekretariat / Pengelola Administrasi"),
    tpl("MHS", "Pemohon / Mahasiswa RPL"),
  ];
  for (const t of templates) {
    await prisma.angketTemplate.upsert({ where: { kode: t.kode }, update: { nama: t.nama }, create: t });
  }

  console.log("Seeding Butir 120 ...");
  for (const b of BUTIR) {
    await prisma.butir.upsert({
      where: { templateId_nomor: { templateId: b.templateId, nomor: b.nomor } } as any,
      update: { teks: b.teks, dimensi: b.dimensi, urut: b.urut, aktif: true },
      create: { templateId: b.templateId, dimensi: b.dimensi, nomor: b.nomor, urut: b.urut, teks: b.teks, aktif: true },
    }).catch(async () => {
      const ex = await prisma.butir.findFirst({ where: { templateId: b.templateId, nomor: b.nomor } });
      if (ex) await prisma.butir.update({ where: { id: ex.id }, data: { teks: b.teks, dimensi: b.dimensi, urut: b.urut } });
      else await prisma.butir.create({ data: { templateId: b.templateId, dimensi: b.dimensi, nomor: b.nomor, urut: b.urut, teks: b.teks } });
    });
  }
  const butirCount = await prisma.butir.count();
  console.log("Butir count:", butirCount);

  console.log("Seeding Periode sampel & Admin ...");
  const existingPeriode = await prisma.periodeMonev.findFirst({ where: { nama: "Monev RPL 2026 Ganjil" } });
  if (!existingPeriode) {
    await prisma.periodeMonev.create({
      data: {
        nama: "Monev RPL 2026 Ganjil",
        tahun: 2026,
        tglMulai: new Date("2026-08-01"),
        tglSelesai: new Date("2026-12-31"),
        status: "aktif",
        deskripsi: "Periode Monev RPL Tipe A Semester Ganjil 2026/2027 — UIN Raden Fatah Palembang",
      },
    });
  }
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@uin-radenfatah.ac.id" },
    update: {},
    create: { email: "admin@uin-radenfatah.ac.id", nama: "Super Admin LPM", role: "SUPER_ADMIN", password: hash },
  });
  const hash2 = await bcrypt.hash("monev123", 10);
  await prisma.user.upsert({
    where: { email: "monev@uin-radenfatah.ac.id" },
    update: {},
    create: { email: "monev@uin-radenfatah.ac.id", nama: "Admin Monev", role: "ADMIN_MONEV", password: hash2 },
  });

  console.log("Seed done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
