# PRD — Website Angket Monev RPL Tipe A UIN Raden Fatah Palembang

> **Sumber:** `Pedoman_Monev_RPL_UIN_Raden_Fatah_Palembang_2026.docx` (138 paragraf, 26 tabel) + `27082025-SK TIM PENGELOLA RPL.pdf` (SK Rektor No. 1699/2025, 14 Agustus 2025, 11 halaman)
> **Tujuan produk:** Digitalisasi seluruh instrumen Monev RPL menjadi website pengisian angket yang **mobile-first, elegan, dan efisien**, plus panel admin untuk pengelolaan data & pelaporan.
> **Tanggal PRD:** 18 Agustus 2026 | **Versi:** 1.1 — Final (keputusan stakeholder 18-08-2026 terkunci)
> **Keputusan final (18-08-2026):** 1) Identitas = **Nama/Jabatan/Unit semua responden** + **Prodi/Fakultas khusus FAK & MHS** · 2) **Dimensi dibedakan sesuai nama di Pedoman** (SEK: Administrasi & Pelayanan; MHS: Informasi & Pendaftaran / Proses Asesmen / Hasil Rekognisi — tidak disamaratakan ke Input/Proses/Output) · 3) Rata-rata rekap = rata-rata dari **semua respons** · 4) **Multi periode aktif** didukung · 5) **Link angket publik** (tanpa token) · 6) BA **tanpa tanda tangan** (PDF siap cetak) · 7) **Bahasa Indonesia** saja
> **Versi 1.2 — FULLY FINAL** (semua 7 poin terkunci)

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Analisis & Pemetaan Dokumen Sumber](#2-analisis--pemetaan-dokumen-sumber)
3. [Visi, Tujuan & Prinsip](#3-visi-tujuan--prinsip)
4. [Stakeholder & Persona](#4-stakeholder--persona)
5. [Ruang Lingkup (Scope)](#5-ruang-lingkup-scope)
6. [Arsitektur Informasi & Peta Situs](#6-arsitektur-informasi--peta-situs)
7. [Alur Pengguna (User Flows)](#7-alur-pengguna-user-flows)
8. [Kebutuhan Fungsional — Sisi Responden](#8-kebutuhan-fungsional--sisi-responden)
9. [Kebutuhan Fungsional — Sisi Admin](#9-kebutuhan-fungsional--sisi-admin)
10. [Model Data & Logika Penilaian](#10-model-data--logika-penilaian)
11. [Persyaratan Non-Fungsional & Desain](#11-persyaratan-non-fungsional--desain)
12. [Keamanan & Kepatuhan](#12-keamanan--kepatuhan)
13. [Analitik, Laporan & Ekspor](#13-analitik-laporan--ekspor)
14. [Spesifikasi UI/UX (Mobile-First, Elegan, Efisien)](#14-spesifikasi-uiux-mobile-first-elegan-efisien)
15. [Teknologi yang Direkomendasikan](#15-teknologi-yang-direkomendasikan)
16. [Roadmap & Milestone](#16-roadmap--milestone)
17. [Kriteria Penerimaan (Acceptance Criteria)](#17-kriteria-penerimaan-acceptance-criteria)
18. [Risiko & Mitigasi](#18-risiko--mitigasi)
19. [Lampiran — Matriks Traceability](#19-lampiran--matriks-traceability)
20. [Keputusan Desain yang Perlu Dikonfirmasi](#20-keputusan-desain-yang-perlu-dikonfirmasi)

---

## 1. Ringkasan Eksekutif

UIN Raden Fatah Palembang menyelenggarakan RPL Tipe A. LPM ditunjuk sebagai penanggung jawab Monev (monitoring & evaluasi) yang mencakup aspek **Input – Proses – Output**, melibatkan 6 kelompok responden utama + pimpinan, dengan 6 instrumen angket baku berisi total **±120 pernyataan skala Likert 1–5** plus 5 pertanyaan terbuka. Saat ini instrumen berbentuk dokumen Word cetak. Website ini menggantikan pengisian kertas dengan pengisian digital yang **cepat di HP**, otomatis menghitung nilai & kategori, merekap per responden, dan menghasilkan laporan/berita acara/RTL siap tanda tangan.

**Nilai yang diberikan produk:**
- Responden mengisi dari HP dalam < 5 menit per angket, tanpa perlu login.
- Admin LPM melihat rekap real-time, unduh Excel/PDF, dan kelola periode Monev tanpa olah manual.
- Audit trail & bukti dokumen terpusat — selaras SPMI & Permendikbudristek 41/2021.

---

## 2. Analisis & Pemetaan Dokumen Sumber

### 2.1 Pedoman Monev RPL 2026 — Struktur

| Bab | Judul | Inti yang Relevan untuk Produk |
|-----|-------|-------------------------------|
| Cover | Pedoman Monev RPL Tipe A UIN Raden Fatah Palembang 2026 — LPM | Identitas, tahun acuan |
| Kata Pengantar | — | Penegasan Monev sistematis/objektif/terukur/berkelanjutan |
| **BAB I** | Pendahuluan | **Latar belakang** RPL; **Dasar hukum** (6 regulasi: UU 20/2003, UU 12/2012, Perpres 8/2012, Permendikbudristek 41/2021, Pedoman RPL UIN, SPMI); **Tujuan Monev** (8 tujuan operasional — menjadi KPI produk); **Prinsip** (objektif, transparan, akuntabel, independen, adil, sistematis, berbasis bukti, berkelanjutan) |
| **BAB II** | Ruang Lingkup & Organisasi Monev | **Tbl 1** ruang lingkup per aspek; **Tbl 2** 8 pihak responden + fokus Monev; Penanggung jawab LPM |
| **BAB III** | Metode Monev | **Metode:** angket + telaah/verifikasi dokumen + wawancara + observasi + dokumentasi. **6 tahapan:** Perencanaan → Persiapan → Pelaksanaan → Analisis → Pelaporan → Tindak lanjut. **Tbl 3** skala 1–5, **Tbl 4** pengolahan nilai `Nilai = (Skor Perolehan / Skor Maksimal) × 100` dengan 5 kategori |
| **BAB IV** | Indikator Monev & Bukti | **Tbl 5** indikator utama & contoh bukti per unit responden (menjadi referensi fitur upload bukti) |
| **BAB V** | Pelaporan, Temuan & Tindak Lanjut | Klasifikasi **Mayor / Minor / Observasi**, **Tbl 6** format temuan, **Tbl 7** RTL, komponen laporan wajib |
| **BAB VI** | Penutup | Penegasan acuan operasional LPM |
| **Lamp. I** | Angket Pengelola RPL Universitas | Responden: Rektor, WR1, Ketua & Sekretaris Pengelola Univ. **Tbl 8** Input 6 butir, **Tbl 9** Proses 8, **Tbl 10** Output 4 → **18 butir**. Header: Nama/Jabatan/Unit/Tanggal |
| **Lamp. II** | Angket Pengelola RPL Fakultas/Pascasarjana/Prodi | Responden: Direktur/Wadir Pascasarjana, Dekan, WDK1, Kaprodi. **Tbl 11** Input 6, **Tbl 12** Proses 9, **Tbl 13** Output 6 → **21 butir**. Header: Nama/Jabatan/Fakultas/Prodi |
| **Lamp. III** | Angket Asesor RPL | Responden: Asesor 1 & 2. **Tbl 14** Input 5, **Tbl 15** Proses Asesmen 14, **Tbl 16** Output 6 → **25 butir**. Header: Nama/Bidang Keahlian/Prodi/Asesor 1/2 |
| **Lamp. IV** | Angket LPM | Responden: Tim LPM. **Tbl 17** Input 7, **Tbl 18** Proses 11, **Tbl 19** Output 8 → **26 butir**. Header: Nama/Jabatan/Unit/Tanggal |
| **Lamp. V** | Angket Sekretariat/Pengelola Administrasi | Responden: Sekretaris Prodi & Staf Admin. **Tbl 20** Administrasi & Pelayanan **10 butir** (satu dimensi). Header: Nama/Jabatan/Unit/Tanggal |
| **Lamp. VI** | Angket Pemohon/Mahasiswa RPL | Responden: Mahasiswa RPL (Jenis: Transfer Kredit / Nonformal-Informal-Pengalaman Kerja). **Tbl 21** Informasi & Pendaftaran 5, **Tbl 22** Proses Asesmen 8, **Tbl 23** Hasil Rekognisi 7 → **20 butir**. Header: Nama-Inisial/Prodi/Jenis RPL/Tahun |
| **Lamp. VII** | Pertanyaan Terbuka & Format Rekap | **5 pertanyaan terbuka** (No 21–25: kekuatan, kendala, perbaikan asesmen, rekomendasi, ketidaksesuaian pedoman) + **Tbl 24** format rekap nilai per responden (Input/Proses/Output/Nilai Akhir/Kategori + Rata-rata) |
| **Lamp. VIII** | Berita Acara Monev | Narasi: hari/tanggal, Fakultas/Pascasarjana, Prodi, periode, nilai & kategori, 3 temuan utama, 3 rekomendasi + **Tbl 25** tanda tangan (LPM & Pimpinan Unit) |
| **Lamp. IX** | Format Rencana Tindak Lanjut | **Tbl 26** RTL (Temuan/Rekomendasi/Program Perbaikan/PIC/Waktu/Indikator Keberhasilan/Status) + **Tbl 6 format temuan** & **Tbl 7 RTL ringkas** |

**Total butir skala Likert: 120** (18+21+25+26+10+20) + 5 terbuka = **125 item** yang harus direplikasi 1:1 di aplikasi.

### 2.2 SK Tim Pengelola RPL — Pemetaan

| Sumber | Isi Kunci | Dampak ke Produk |
|--------|-----------|-----------------|
| **SK Rektor No. 1699/2025** (14-08-2025) — Diktum KESATU & KEDUA, Menimbang/Mengingat 10 dasar hukum | Menetapkan Tim Pengelola RPL UIN Raden Fatah Palembang | Menjadi **sumber master data** Unit & Jabatan; memvalidasi opsi dropdown Fakultas/Prodi/Jabatan |
| **Lamp. I — Tingkat Universitas** | **24 orang**: Rektor, 3 WR, 2 Ka.Biro (AAKK/AUPK), Kabag Akademik & Kemahasiswaan, Ka.Organisasi & Kepegawaian, Ka.PUSTIPD, 8 Pranata Komputer Ahli, 2 Terampil, Operator, 5 staf Pusat Layanan Internasional | Pilihan "Unit = Universitas" + jabatan terkait; untuk filter rekap tingkat universitas |
| **Lamp. I — Tingkat Pascasarjana** | **8 orang**: Direktur & Wadir Pascasarjana, Ka/Sek Prodi S3 PAI, S3 Peradaban Islam, S2 Studi Islam | Pilihan "Fakultas = Pascasarjana" + prodi S2/S3 tersebut |
| **Lamp. II–III — Tingkat Fakultas** | **±106 orang** Kaprodi/Sekprodi & Dekan/WDK1 dari **8 fakultas**: Ilmu Tarbiyah & Keguruan (±28), Psikologi (4), Dakwah & Komunikasi (±12), Sains & Teknologi (±5 terdata, sisanya di halaman lanjutan), Syariah, Ekonomi & Bisnis Islam, Adab & Humaniora, Ushuluddin — SK lengkap 11 halaman | Menjadi **opsi Fakultas & Prodi** di form identitas; mendukung validasi "Prodi Penyelenggara RPL" |

> **Catatan pemetaan:** SK menetapkan *siapa* pengelola (otoritas/koordinator), sedangkan Pedoman menetapkan *siapa* responden angket. Keduanya selaras — 4 dari 6 instrumen angket ditujukan ke pengelola/asesor/sekretariat yang namanya ada di SK. Data SK dipakai sebagai **seed** untuk master Fakultas/Prodi/Jabatan agar responden tidak salah ketik.

### 2.3 Matriks Responden ↔ Angket ↔ Jumlah Butir

| # | Jenis Angket (di App) | Kode | Responden yang Tercantum di Pedoman | Butir (Input/Proses/Output) | Total |
|---|----------------------|------|-------------------------------------|-----------------------------|-------|
| 1 | Pengelola RPL Universitas | `UNIV` | Rektor, WR1, Ketua Pengelola Univ, Sekretaris Pengelola Univ | 6 / 8 / 4 | **18** |
| 2 | Pengelola RPL Fakultas/Pascasarjana/Prodi | `FAK` | Direktur/Wadir Pascasarjana, Dekan, WDK1, Kaprodi | 6 / 9 / 6 | **21** |
| 3 | Asesor RPL | `ASESOR` | Tim Asesor (Asesor 1/Asesor 2) | 5 / 14 / 6 | **25** |
| 4 | LPM | `LPM` | Tim LPM | 7 / 11 / 8 | **26** |
| 5 | Sekretariat / Pengelola Administrasi | `SEK` | Sekretaris Prodi, Staf Admin Prodi | 10 (satu blok) | **10** |
| 6 | Pemohon / Mahasiswa RPL | `MHS` | Mahasiswa RPL | 5 / 8 / 7 | **20** |
| — | Pertanyaan Terbuka (di akhir setiap angket) | — | Semua responden | 5 pertanyaan esai | **5** |
| **Total** | | | | | **125** |

### 2.4 Aturan Penilaian (BAB III.C–D) — Harus Diotomasi

- **Skala Likert 5 poin** (Tbl 3):
  - 5 = Sangat Baik/Sangat Sesuai — terpenuhi lengkap, konsisten, efektif, terdokumentasi
  - 4 = Baik/Sesuai — sedikit kekurangan
  - 3 = Cukup — sebagian, belum konsisten/optimal
  - 2 = Kurang — sebagian kecil, perlu perbaikan
  - 1 = Sangat Kurang — belum dilaksanakan / bukti tidak memadai
- **Rumus nilai:** `Nilai = (Σ skor perolehan / Σ skor maksimal) × 100` — dihitung per dimensi (Input/Proses/Output), per responden, dan rata-rata/ agregat periode.
- **Kategori (Tbl 4):**
  - 86–100 = Sangat Baik — dipertahankan & ditingkatkan
  - 76–85 = Baik — perbaikan minor
  - 66–75 = Cukup — perbaikan terencana
  - 51–65 = Kurang — tindakan korektif
  - ≤50 = Sangat Kurang — korektif segera
- **Rekap (Tbl 24):** Matriks Responden × (Input, Proses, Output, Nilai Akhir, Kategori) + baris Rata-rata.

---

## 3. Visi, Tujuan & Prinsip

### 3.1 Visi
Monev RPL yang **tanpa kertas, tanpa rekap manual, dan dapat diaudit** — responden cukup buka link di HP, admin langsung dapat dashboard & laporan resmi.

### 3.2 Tujuan Produk (diturunkan dari BAB I.C)

| Tujuan Pedoman (8 poin) | Fitur yang Menjawab |
|-------------------------|---------------------|
| Menilai kesiapan input | Angket Input per responden + skor otomatis |
| Menilai keterlaksanaan proses | Angket Proses + verifikasi bukti (upload opsional) |
| Menilai kualitas asesmen & rekognisi | Blok Asesor (25 butir VATM: Valid, Autentik, Terkini, Memadai) |
| Menilai ketercapaian output | Angket Output + rekap nilai akhir |
| Mengidentifikasi kekuatan/kelemahan/ketidaksesuaian | Pertanyaan terbuka + klasifikasi temuan Mayor/Minor/Observasi |
| Memperoleh umpan balik penyelenggara & penerima layanan | Angket Mahasiswa (kepuasan & keadilan) |
| Merumuskan rekomendasi & RTL | Modul Temuan & RTL (Tbl 6/7/26) |
| Mendorong peningkatan mutu berkelanjutan | Dashboard tren per periode + indikator keberhasilan RTL |

### 3.3 Prinsip (BAB I.D) yang Diterjemahkan ke Produk

Objektif (skor baku, bukan opini admin), transparan (responden lihat ringkasan skornya), akuntabel (audit log), independen (admin tidak bisa ubah jawaban responden — hanya anulir dengan alasan), adil (anonim opsional untuk mahasiswa), sistematis (alur Input→Proses→Output→Terbuka), berbasis bukti (lampiran bukti opsional), berkelanjutan (riwayat periode).

---

## 4. Stakeholder & Persona

### 4.1 Stakeholder

| Pihak | Peran di Monev | Peran di Aplikasi |
|-------|---------------|-------------------|
| **LPM** (penanggung jawab) | Menyelenggarakan Monev, menyusun laporan & RTL | **Super Admin** — kelola periode, angket, pengguna, laporan, BA, RTL |
| **Tim Pelaksana Monev** | Pelaksana Monev | **Admin Monev** — input temuan, verifikasi, kelola RTL |
| **Pengelola Univ** (Rektorat, Biro, PUSTIPD) | Responden angket UNIV | Responden (link angket UNIV) |
| **Pengelola Fakultas/Pascasarjana/Prodi** | Responden angket FAK | Responden (link angket FAK) |
| **Asesor RPL** | Responden angket ASESOR | Responden (link angket ASESOR) |
| **Sekretariat / Staf Admin** | Responden angket SEK | Responden (link angket SEK) |
| **Pemohon / Mahasiswa RPL** | Responden angket MHS | Responden (link angket MHS) |
| **Pimpinan Fakultas/Pascasarjana & Rektorat** | Penerima laporan & penanda tangan BA/RTL | Viewer laporan + e-sign (fase 2) |

### 4.2 Persona Utama

**Persona 1 — Siti, Staf LPM (Admin, 34 th, laptop + HP)**
> "Setiap periode saya sebar link angket via WA, lalu rekap manual di Excel seharian. Saya butuh dashboard yang langsung jadi, bisa filter per fakultas, dan ekspor BA/RTL untuk ditandatangani."

**Persona 2 — Budi, Kaprodi PAI (Responden FAK, 42 th, HP Android)**
> "Saya sibuk mengajar. Kalau angketnya panjang dan tidak bisa lanjut nanti, saya tunda terus. Tolong bisa disimpan progresnya dan font-nya enak dibaca di HP."

**Persona 3 — Aisyah, Mahasiswa RPL Transfer Kredit (Responden MHS, 27 th, HP)**
> "Saya ingin tahu hasil RPL saya jelas dan merasa diperlakukan adil. Kalau ada pertanyaan terbuka saya ingin bisa menulis bebas tanpa takut nama saya disebar."

---

## 5. Ruang Lingkup (Scope)

### 5.1 In Scope — MVP (Rilis 1)

- 6 jenis angket digital (120 butir skala 1–5) + 5 pertanyaan terbuka — replikasi 1:1 dari Pedoman.
- Pengisian tanpa login (**link publik** per jenis angket — tanpa token), mobile-first, simpan progres (localStorage + server draft).
- Identitas responden: **Nama + Jabatan + Unit untuk semua responden**, ditambah **Program Studi + Fakultas khusus angket FAK & MHS** (lihat §8.2).
- Header daftar Responden per angket tampil verbatim dari Pedoman Lamp. I–VI (lihat §8.2).
- Perhitungan otomatis: skor per dimensi, nilai 0–100, kategori & tindak lanjut, rekap Tbl 24.
- Panel admin: login, manajemen periode Monev, daftar respons, filter (periode/fakultas/prodi/jenis angket/kategori), detail jawaban, rekap & statistik.
- Ekspor: Excel per angket & rekap gabungan; PDF ringkasan per respons, rekap Tbl 24, Berita Acara sederhana (Lamp. VIII **tanpa tanda tangan**), RTL (Lamp. IX/Tbl 26).
- Modul Temuan (Mayor/Minor/Observasi) & RTL dasar.
- Audit log sederhana.

### 5.2 Fase 2 (Nice-to-Have, Tidak Menghambat MVP)

- Upload bukti dokumen per butir/dimensi (Tbl 5).
- ~~Tanda tangan elektronik BA/RTL~~ — tidak diperlukan (BA tanpa tanda tangan, §20 poin 6).
- Mode wawancara/observasi (catatan lapangan) & verifikasi dokumen.
- Notifikasi WA/Email blast link angket.
- Dashboard tren multi-periode & perbandingan fakultas.
- SSO kampus / integrasi PDDikti/SIAKAD.

### 5.3 Out of Scope

- Sistem informasi RPL itu sendiri (pendaftaran, portofolio, asesmen) — app ini hanya Monev.
- Pengelolaan kurikulum/CPMK.
- Pembayaran/keuangan.

---

## 6. Arsitektur Informasi & Peta Situs

### 6.1 Arsitektur Aplikasi (Express + React + MySQL + SSE)

```
Browser (React SPA)  ──REST /api/*──▶  Express API  ──Prisma──▶  MySQL
        │                    ▲                             
        └──SSE /api/events──┘   (broadcast respons/rekap/dashboard)
Nginx: / → client build (static), /api & /events → proxy ke Express
```

### 6.2 Peta Situs (React Router)

```
[Public — tanpa login]
 /                          → Landing — hero, tentang RPL & Monev, pilih periode & jenis angket
 /angket/:slug              → Pengisian angket (6 varian) — wizard Input→Proses→Output→Terbuka
 /angket/:slug/terima-kasih → Halaman sukses + ringkasan skor & kategori + tombol unduh PDF
 /berita-acara/:id          → (opsional publik) Lihat BA per periode/fakultas (read-only)

[Admin — butuh login JWT]
 /admin/login               → Login admin
 /admin                     → Dashboard — KPI periode aktif, distribusi kategori, respons terbaru (SSE live)
 /admin/periode             → CRUD Periode Monev (nama, rentang tanggal, status: draft/aktif/tutup)
 /admin/respons             → Daftar semua respons + filter & pencarian + aksi (lihat/hapus/anulir/ekspor) — SSE live
 /admin/respons/:id         → Detail respons — identitas, jawaban per dimensi, skor, terbuka, audit
 /admin/rekap               → Rekap matriks responden × dimensi + rata-rata; ekspor Excel/PDF — SSE live
 /admin/temuan              → Daftar temuan (Tbl 6) — tambah/edit, klasifikasi, akar masalah, rekomendasi
 /admin/rtl                 → RTL (Tbl 26) — program perbaikan, PIC, waktu, indikator, status
 /admin/berita-acara        → Generate BA (Lamp. VIII) per fakultas/prodi/periode
 /admin/angket              → Kelola template angket (lihat butir, nonaktifkan butir bila pedoman berubah)
 /admin/master              → Master Fakultas/Prodi/Jabatan (seed dari SK 1699/2025)
 /admin/pengguna            → Kelola akun admin (Super Admin vs Admin Monev)
 /admin/pengaturan          → Pengaturan umum (logo UIN, kop surat, tahun, teks landing)

[API — Express]
 /api/periode, /api/angket, /api/respons, /api/rekap, /api/temuan, /api/rtl, /api/berita-acara, /api/master, /api/auth
 /api/events                → SSE stream (text/event-stream) — query: periodeId, channel (dashboard|rekap|respons)
```

### 6.2 Navigasi Mobile vs Desktop

- **Mobile (prioritas):** bottom tab untuk responden (Progress, Daftar Isi), sticky header dengan progress bar, tombol Selanjutnya/Kembali besar, radio skala 1–5 sebagai chip/card yang mudah di-tap.
- **Admin desktop:** sidebar collapsible; di HP admin tetap usable (tabel jadi card list, filter jadi drawer).

---

## 7. Alur Pengguna (User Flows)

### 7.1 Responden — Pengisian Angket (Happy Path)

```
Landing → Pilih jenis angket (6 kartu) → Form Identitas (wajib) →
Dimensi Input (butir 1–n) → Dimensi Proses → Dimensi Output →
  (untuk SEK: satu blok Administrasi) →
Pertanyaan Terbuka (5 esai, opsional) →
Tinjau Jawaban (review) → Kirim →
Halaman Terima Kasih (ringkasan skor per dimensi + nilai akhir + kategori + tindak lanjut) →
[Opsional] Unduh PDF ringkasan
```
- **Simpan progres:** setiap perubahan auto-save ke server draft (debounced) + localStorage fallback; responden bisa tutup tab dan lanjut via link yang sama.
- **Validasi:** blok lanjut hanya jika semua butir skala di dimensi terjawab; identitas wajib; esai opsional.
- **Anti-duplikat:** token link per periode + fingerprint (opsional) — admin bisa atur "satu respons per orang" atau "izinkan lebih dari satu".

### 7.2 Admin — Mengelola Periode & Melihat Rekap

```
Login → Dashboard (pilih Periode Aktif) → Buat Periode Baru (nama, tanggal, fakultas sasaran) →
Salin Link Angket (6 link) → Sebar via WA/Email →
Pantau Respons Real-time (tabel respons) →
Buka Rekap (Tbl 24) → Filter per Fakultas/Prodi →
Ekspor Excel/PDF → Generate Berita Acara & RTL → Tindak Lanjut
```

---

## 8. Kebutuhan Fungsional — Sisi Responden

### 8.1 Landing Page (`/`)

| Elemen | Deskripsi |
|--------|-----------|
| Hero | Judul "Angket Monev RPL Tipe A — UIN Raden Fatah Palembang", subjudul LPM 2026, CTA "Isi Angket" |
| Tentang | Ringkasan 2 paragraf dari Kata Pengantar + prinsip Monev (8 prinsip sebagai chip) |
| Pilih Angket | 6 kartu besar (ikon + judul + siapa responden + jumlah butir + estimasi waktu) — tap → `/angket/:slug` |
| Info | Periode aktif, kontak LPM, dasar hukum (6 regulasi sebagai accordion) |
| Footer | Logo UIN, © LPM, link Admin |

### 8.2 Form Identitas & Daftar Responden — Per Jenis Angket

Setiap angket memiliki **dua lapis informasi** sesuai Pedoman (Lamp. I–VI):

1. **Header "Responden"** — daftar pihak yang *berhak* mengisi angket tersebut (ditampilkan sebagai badge/info di halaman angket, bukan field isian).
2. **Form identitas** — field yang *wajib diisi* responden sebelum masuk ke butir angket.

> **Aturan identitas (klarifikasi 18-08-2026):**
> - **Semua responden** wajib isi: **Nama, Jabatan, Unit**
> - **Khusus angket FAK & MHS** ditambah: **Program Studi, Fakultas**
> - Tanggal diisi otomatis (`submittedAt`, hidden)

#### A. Header "Responden" per Angket (verbatim dari Pedoman — tampil sebagai info)

| Angket | Daftar Responden (badge/info di halaman angket) | Butir Angket | Dimensi |
|--------|------------------------------------------------|-------------|---------|
| **UNIV** (Lamp. I) | Rektor · Wakil Rektor 1 · Ketua Pengelola RPL Universitas · Sekretaris Pengelola RPL Universitas | 18 | Input 6, Proses 8, Output 4 |
| **FAK** (Lamp. II) | Direktur Pascasarjana · Wakil Direktur Pascasarjana · Dekan · Wakil Dekan 1 · Ketua Program Studi Penyelenggara RPL | 21 | Input 6, Proses 9, Output 6 |
| **ASESOR** (Lamp. III) | Tim Asesor RPL (Asesor 1 / Asesor 2) | 25 | Input 5, Proses 14, Output 6 |
| **LPM** (Lamp. IV) | Tim LPM | 26 | Input 7, Proses 11, Output 8 |
| **SEK** (Lamp. V) | Sekretaris Prodi Penyelenggara RPL · Staf Administrasi Prodi Penyelenggara RPL | 10 | Administrasi & Pelayanan 10 |
| **MHS** (Lamp. VI) | Mahasiswa RPL | 20 | Informasi 5, Proses Asesmen 8, Hasil Rekognisi 7 |

> Header tampil di atas wizard sebagai baris badge `Angket ini ditujukan untuk: [chip-chip]` — membantu responden memastikan mereka membuka angket yang tepat. Setelah identitas terisi, butir angket yang sesuai (kolom "Butir Angket") langsung ditampilkan di bawahnya.

#### B. Form Identitas (field isian)

| Field | Tipe | Untuk Angket | Validasi |
|-------|------|-------------|----------|
| **Nama** | text | Semua (UNIV, FAK, ASESOR, LPM, SEK, MHS) | Wajib, min 2 karakter |
| **Jabatan** | text / dropdown (opsional, dari master) | Semua | Wajib |
| **Unit** | text | Semua | Wajib |
| **Program Studi** | dropdown (filtered by Fakultas) | **Hanya FAK & MHS** | Wajib jika FAK/MHS |
| **Fakultas** | dropdown (dari master SK 1699/2025) | **Hanya FAK & MHS** | Wajib jika FAK/MHS |

- Untuk **UNIV / ASESOR / LPM / SEK**: form hanya menampilkan 3 field (Nama, Jabatan, Unit).
- Untuk **FAK & MHS**: form menampilkan 5 field (Nama, Jabatan, Unit, Prodi, Fakultas). Dropdown Prodi difilter berdasarkan Fakultas yang dipilih.
- Tanggal tidak perlu diisi manual — otomatis `submittedAt` saat submit.
- Contoh — responden membuka `/angket/fak`: di atas form tampil badge "Direktur Pascasarjana · Dekan · WDK1 · Kaprodi (21 butir)", lalu form 5 field di bawahnya.

### 8.3 Pengisian Butir Skala 1–5

- **Tata letak per dimensi:** header dimensi (A. Input / B. Proses / C. Output) + deskripsi singkat + progress "Dimensi 1 dari 3 — Butir 4 dari 6".
- **Per butir:** kartu dengan nomor, teks pernyataan (verbatim dari Tbl 8–23), dan **5 opsi radio horizontal** (mobile: 5 chip besar 1–5, label kategori muncul saat dipilih: "1 Sangat Kurang" dst). Warna chip netral; yang terpilih diberi aksen.
- **Aksesibilitas:** keyboard navigable, screen-reader label lengkap, tap target ≥ 44px.
- **Bantuan:** tooltip "?" di tiap butir menampilkan deskripsi kategori skala (Tbl 3) — tanpa menavigasi jauh.
- **Khusus ASESOR butir 3 (Tbl 15):** beri badge "VATM — Valid, Autentik, Terkini, Memadai" sebagai hint.

### 8.4 Pertanyaan Terbuka (Lamp. VII, No 21–25)

Muncul setelah semua dimensi skala selesai, sebagai bagian terakhir sebelum review:

1. Apa kekuatan utama penyelenggaraan RPL?
2. Apa kendala/permasalahan yang ditemukan?
3. Apa aspek yang perlu diperbaiki dalam proses asesmen?
4. Apa rekomendasi untuk meningkatkan mutu penyelenggaraan RPL?
5. Jika terdapat ketidaksesuaian terhadap pedoman RPL, jelaskan.

- Textarea autosize, placeholder, opsional (tidak memblokir kirim), counter karakter.
- Disimpan sebagai `jawaban_terbuka` terpisah dari skor.

### 8.5 Tinjau & Kirim

- Halaman review menampilkan: identitas, ringkasan jawaban per dimensi (butir + skor terpilih), daftar butir yang belum dijawab (jika ada) dengan link "Lengkapi".
- Checkbox persetujuan: "Saya menyatakan jawaban ini benar dan dapat digunakan untuk Monev RPL."
- Tombol **Kirim** (primary, full-width di HP) → konfirmasi dialog → submit.

### 8.6 Halaman Terima Kasih & Ringkasan Skor

Setelah submit:

- Pesan: "Terima kasih, respons Anda telah tercatat."
- **Ringkasan skor pribadi:** skor Input/Proses/Output, Nilai Akhir (0–100), Kategori & Tindak Lanjut (Tbl 4), tampil sebagai kartu metrik.
- Tombol: "Isi angket lain", "Kembali ke beranda", "Unduh ringkasan (PDF)".
- Tidak menampilkan data responden lain.

---

## 9. Kebutuhan Fungsional — Sisi Admin

### 9.1 Autentikasi

| Fitur | Detail |
|-------|--------|
| Login | Email + password, remember me, rate-limit, lockout |
| Role | `SUPER_ADMIN` (kelola pengguna & pengaturan) dan `ADMIN_MONEV` (kelola periode/respons/temuan/RTL) |
| Lupa password | Reset via email (fase 2) atau reset manual oleh Super Admin |
| Sesi | JWT httpOnly cookie, expiry 8 jam, refresh |

### 9.2 Dashboard (`/admin`)

KPI untuk **periode aktif** (selector periode di header):

- Total respons (angka + breakdown per jenis angket sebagai donut/bar)
- Distribusi kategori (Sangat Baik s.d. Sangat Kurang) — bar chart
- Rata-rata Nilai Akhir per jenis angket — bar chart
- Respons terbaru (5 terakhir) — tabel mini
- Peringatan: periode akan berakhir, respons dengan kategori ≤50

### 9.3 Manajemen Periode Monev (`/admin/periode`)

| Field | Tipe | Ket |
|-------|------|-----|
| Nama periode | text | mis. "Monev RPL 2026 Semester Ganjil" |
| Tahun | number | default 2026 |
| Rentang tanggal | date range | untuk filter & status |
| Fakultas/Prodi sasaran | multi-select | opsional, untuk BA per unit |
| Status | draft / aktif / tutup | hanya `aktif` yang menerima respons; `tutup` = read-only |
| Link angket | auto-generate 6 URL | copy button per jenis |
| Deskripsi | textarea | tampil di landing saat periode aktif |

Aturan: **multi periode `aktif` didukung** (sesuai keputusan 18-08-2026). Setiap periode punya 6 link angket publik sendiri. `tutup` = read-only, tidak menerima submit baru. Landing menampilkan daftar periode aktif (responden pilih periode sebelum pilih angket).

### 9.4 Daftar Respons (`/admin/respons`)

- Tabel: Tanggal, Jenis Angket, Nama, Fakultas/Prodi, Nilai Akhir, Kategori (badge warna), Aksi.
- Filter: periode, jenis angket, fakultas, prodi, kategori, rentang tanggal, pencarian nama.
- Sort & paginasi.
- Aksi per baris: Lihat Detail, Anulir (dengan alasan — soft delete, tidak hard delete), Hapus (Super Admin saja, konfirmasi).
- Bulk: Ekspor terfilter ke Excel, Cetak PDF terpilih.

### 9.5 Detail Respons (`/admin/respons/:id`)

- Header: identitas lengkap, timestamp, periode, IP/UA (audit).
- Per dimensi: tabel butir + skor + kategori per butir, subtotal skor & nilai dimensi.
- Ringkasan: Nilai Akhir & Kategori & Tindak Lanjut.
- Jawaban terbuka (5 esai) — tampil sebagai blockquote.
- Audit trail mini: dibuat/diupdate oleh siapa (responden vs admin).

### 9.6 Rekap (`/admin/rekap` — pengembangan dari Lamp. VII Tbl 24)

> **Keputusan 18-08-2026: dimensi dibedakan sesuai nama aslinya di Pedoman** — tidak disamaratakan ke Input/Proses/Output bila namanya memang beda.

#### Rekap per Dimensi (tabel utama di UI)

| Responden | Dimensi | Jumlah Butir | Nilai Rata-rata (0–100) | Kategori |
|-----------|---------|-------------|------------------------|----------|
| Pengelola Universitas | Input | 6 | avg | — |
|  | Proses | 8 | avg | — |
|  | Output | 4 | avg | — |
| Fakultas/Pascasarjana | Input | 6 | avg | — |
|  | Proses | 9 | avg | — |
|  | Output | 6 | avg | — |
| Asesor | Input | 5 | avg | — |
|  | Proses Asesmen | 14 | avg | — |
|  | Output | 6 | avg | — |
| Sekretariat | Administrasi & Pelayanan | 10 | avg | — |
| LPM | Input | 7 | avg | — |
|  | Proses | 11 | avg | — |
|  | Output | 8 | avg | — |
| Mahasiswa/Pemohon | Informasi & Pendaftaran | 5 | avg | — |
|  | Proses Asesmen | 8 | avg | — |
|  | Hasil Rekognisi | 7 | avg | — |

#### Rekap Nilai Akhir per Kelompok

| Responden | Nilai Akhir (avg) | Kategori | Tindak Lanjut | Jumlah Respons |
|-----------|-------------------|----------|---------------|----------------|
| Pengelola Universitas | avg | — | — | n |
| Fakultas/Pascasarjana | avg | — | — | n |
| Asesor | avg | — | — | n |
| Sekretariat | avg | — | — | n |
| LPM | avg | — | — | n |
| Mahasiswa/Pemohon | avg | — | — | n |
| **Rata-rata (semua respons)** | **avg** | **—** | **—** | **total** |

- Nilai per sel = rata-rata Nilai dimensi dari semua respons pada kelompok & dimensi tersebut di periode terpilih.
- Filter: periode (bisa multi-periode), fakultas/prodi (mempersempit FAK/ASESOR/SEK/MHS).
- Ekspor:
  - **Excel:** 2 sheet — Sheet 1 "Rekap per Dimensi" (tabel pertama), Sheet 2 "Rekap Nilai Akhir" (tabel kedua). Tetap kompatibel untuk cetak.
  - **PDF:** ringkasan kedua tabel + kop UIN, siap arsip.
- **Baris "Rata-rata"** = rata-rata dari **semua respons** (bukan rata-rata kelompok).

### 9.7 Temuan (`/admin/temuan` — Tbl 6)

| Field | Tipe |
|-------|------|
| No | auto |
| Temuan | textarea |
| Bukti | textarea / upload (fase 2) |
| Kategori | select: Mayor / Minor / Observasi |
| Akar Masalah | textarea |
| Rekomendasi | textarea |
| Periode & Unit | relation |

- CRUD + filter kategori/periode/unit.
- Terhubung ke RTL (satu temuan bisa punya banyak RTL).

### 9.8 RTL (`/admin/rtl` — Tbl 26)

| Field | Tipe |
|-------|------|
| Temuan | relation ke Temuan |
| Rekomendasi | text (auto dari temuan, editable) |
| Program Perbaikan | textarea |
| PIC | text (nama/jabatan) |
| Waktu | date range |
| Indikator Keberhasilan | textarea |
| Status | select: Belum / Proses / Selesai / Tertunda |

- Kanban atau tabel dengan filter status/periode.

### 9.9 Berita Acara (`/admin/berita-acara` — Lamp. VIII, tanpa tanda tangan)

Generator BA per **periode + fakultas/prodi**:

- Input: pilih periode, fakultas, prodi, tanggal BA.
- Output PDF dengan kop UIN, narasi baku Lamp. VIII (hari/tanggal, periode, nilai & kategori dari rekap), daftar 3 temuan utama & 3 rekomendasi (diambil dari modul Temuan) — **tanpa blok tanda tangan** (sesuai keputusan 18-08-2026).
- Preview sebelum cetak.

### 9.10 Kelola Angket & Master

- `/admin/angket`: daftar 6 template, lihat butir (read-only di MVP), toggle aktif/nonaktif per butir jika pedoman direvisi. Edit teks butir hanya Super Admin dengan konfirmasi (karena mengubah instrumen baku).
- `/admin/master`: CRUD Fakultas, Prodi (relasi ke Fakultas), Jabatan. Seed awal dari SK 1699/2025.

---

## 10. Model Data & Logika Penilaian

> **DB: MySQL 8 + Prisma (`provider = "mysql"`).** Tipe Prisma disesuaikan MySQL (mis. `Json` → `Json`, `@db.Text` tetap, `@default(cuid())` → `@default(cuid())` atau `uuid()`). SSE: setelah `Respons` submitted / `Temuan`/`RTL` diubah, server `emit` event ke semua client SSE yang subscribe channel terkait.

### 10.1 ERD (Konseptual)

```
PeriodeMonev 1──∞ Respons (multi periode aktif didukung)
Respons ∞──1 AngketTemplate (UNIV/FAK/ASESOR/LPM/SEK/MHS)
Respons 1──∞ JawabanSkala (butir_id, skor 1-5)
Respons 1──1 JawabanTerbuka (5 esai)
Respons ── SkorHitung (inputNilai, prosesNilai, outputNilai, nilaiAkhir, kategori, tindakLanjut)
AngketTemplate 1──∞ Butir (dimensi, nomor, teks, urut)
Fakultas 1──∞ Prodi
Respons ── Fakultas/Prodi (hanya untuk FAK & MHS; lainnya: Nama/Jabatan/Unit)
Temuan ∞──1 PeriodeMonev; Temuan 1──∞ RTL
BeritaAcara ∞──1 PeriodeMonev (tanpa tanda tangan)
User (admin) 1──∞ AuditLog
```

### 10.2 Skema Ringkas (Prisma-style)

```prisma
model PeriodeMonev {
  id          String   @id @cuid
  nama        String
  tahun       Int
  tglMulai    DateTime
  tglSelesai  DateTime
  status      String   // draft | aktif | tutup
  deskripsi   String?
  createdAt   DateTime @default(now())
  respons     Respons[]
  temuan      Temuan[]
  beritaAcara BeritaAcara[]
}

model AngketTemplate {
  kode  String @id // UNIV, FAK, ASESOR, LPM, SEK, MHS
  nama  String
  butir Butir[]
}

model Butir {
  id         String @id @cuid
  templateId String
  dimensi    String // Input | Proses | Output | Administrasi | InformasiPendaftaran | ProsesAsesmen | HasilRekognisi | Terbuka
  nomor      Int
  teks       String @db.Text
  urut       Int
  aktif      Boolean @default(true)
  template   AngketTemplate @relation(fields: [templateId], references: [kode])
}

model Respons {
  id            String   @id @cuid
  periodeId     String
  templateKode  String
  // identitas fleksibel (JSON untuk variasi per jenis)
  identitas     Json     // { nama, jabatan, unit, prodi?, fakultas? } — prodi/fakultas hanya untuk FAK & MHS (18-08-2026)
  status        String   // draft | submitted | anulir
  alasanAnulir  String?
  // jawaban
  jawabanSkala  JawabanSkala[]
  jawabanTerbuka JawabanTerbuka?
  // hitung (denormalized untuk query cepat)
  skorInput     Float?
  skorProses    Float?
  skorOutput    Float?   // untuk SEK = skorAdministrasi
  nilaiInput    Float?   // 0-100
  nilaiProses   Float?
  nilaiOutput   Float?
  nilaiAkhir    Float?
  kategori      String?  // Sangat Baik | Baik | Cukup | Kurang | Sangat Kurang
  tindakLanjut  String?
  createdAt     DateTime @default(now())
  submittedAt   DateTime?
  ip            String?
  userAgent     String?
}

model JawabanSkala {
  id        String @id @cuid
  responsId String
  butirId   String
  skor      Int    // 1-5
}

model JawabanTerbuka {
  id        String @id @cuid
  responsId String @unique
  q21       String? @db.Text
  q22       String? @db.Text
  q23       String? @db.Text
  q24       String? @db.Text
  q25       String? @db.Text
}

model Temuan {
  id          String @id @cuid
  periodeId   String
  unit        String? // fakultas/prodi
  temuan      String  @db.Text
  bukti       String? @db.Text
  kategori    String  // Mayor | Minor | Observasi
  akarMasalah String? @db.Text
  rekomendasi String? @db.Text
  rtl         RTL[]
}

model RTL {
  id                   String @id @cuid
  temuanId             String
  programPerbaikan     String @db.Text
  pic                  String
  tglMulai             DateTime?
  tglSelesai           DateTime?
  indikatorKeberhasilan String? @db.Text
  status               String // Belum | Proses | Selesai | Tertunda
}

model BeritaAcara {
  id              String   @id @cuid
  periodeId       String
  fakultas        String?
  prodi           String?
  tanggalBA       DateTime
  nilai           Float?
  kategori        String?
  temuanUtama     Json // string[3]
  rekomendasi     Json // string[3]
  timMonevNama    String
  timMonevNip     String?
  pimpinanNama    String
  pimpinanNip     String?
}

model User {
  id        String @id @cuid
  email     String @unique
  nama      String
  role      String // SUPER_ADMIN | ADMIN_MONEV
  password  String // hashed
}

model AuditLog {
  id        String   @id @cuid
  userId    String?
  aksi      String
  target    String?
  detail    Json?
  createdAt DateTime @default(now())
}
```

### 10.3 Rumus & Kategori (Implementasi)

```ts
// Per dimensi (contoh Input: 6 butir → skorMaks = 6*5 = 30)
function nilaiDimensi(skorPerolehan: number, jumlahButir: number): number {
  return (skorPerolehan / (jumlahButir * 5)) * 100;
}

// Nilai akhir respons = rata-rata nilai dimensi yang ada (atau total skor / total maks)
// Opsi yang dipakai: rata-rata dimensi (lebih adil bila dimensi jumlah butirnya beda)
function nilaiAkhir(nilaiPerDimensi: number[]): number {
  return nilaiPerDimensi.reduce((a,b)=>a+b,0) / nilaiPerDimensi.length;
}

function kategori(nilai: number): { label: string; tindak: string } {
  if (nilai >= 86) return { label: "Sangat Baik", tindak: "Dipertahankan dan ditingkatkan" };
  if (nilai >= 76) return { label: "Baik", tindak: "Perbaikan minor" };
  if (nilai >= 66) return { label: "Cukup", tindak: "Perbaikan terencana" };
  if (nilai >= 51) return { label: "Kurang", tindak: "Tindakan korektif" };
  return { label: "Sangat Kurang", tindak: "Tindakan korektif segera" };
}
```

- Untuk **SEK** (10 butir, dimensi "Administrasi & Pelayanan"): `nilaiAkhir = nilaiAdministrasi`.
- Untuk **MHS** (5+8+7 butir, dimensi "Informasi & Pendaftaran" / "Proses Asesmen" / "Hasil Rekognisi"): `nilaiAkhir = avg(nilaiInformasi, nilaiProsesAsesmen, nilaiHasil)`.
- **Rekap — baris "Rata-rata":** rata-rata dari **semua respons** (sesuai keputusan 18-08-2026, poin 3).

---

## 11. Persyaratan Non-Fungsional & Desain

| Aspek | Target |
|-------|--------|
| **Mobile-first** | Breakpoint utama 360–428px; semua alur responden dapat diselesaikan tanpa scroll horizontal; tap target ≥44px; form wizard step-by-step (bukan satu halaman panjang) |
| **Performa** | LCP < 2.5s di 4G; bundle JS < 150KB gz; image optimized; no heavy framework di halaman publik |
| **Aksesibilitas** | WCAG 2.1 AA: kontras, label, keyboard, screen reader |
| **Keandalan** | Auto-save draft tiap 2 detik (debounced); localStorage fallback jika offline sesaat; tidak ada kehilangan jawaban saat refresh |
| **Skalabilitas** | Mendukung 500+ respons per periode tanpa degradasi rekap |
| **SEO** | Landing terindeks; halaman angket `noindex` (privasi) |
| **Browser** | Chrome/Edge/Safari/Firefox terbaru + Android WebView |

---

## 12. Keamanan & Kepatuhan

- **Privasi responden:** Nama mahasiswa boleh inisial/anonim; halaman angket tidak terindeks; data tidak dipublikasi tanpa agregasi.
- **Anti-tamper:** Admin tidak dapat mengubah `JawabanSkala` yang sudah `submitted`; hanya bisa Anulir (soft delete + alasan + audit log).
- **Auth admin:** bcrypt, rate-limit login, httpOnly cookie, CSRF protection.
- **Validasi:** skor hanya 1–5 (enum), identitas wajib sesuai jenis, sanitasi esai, validasi sisi server.
- **Audit log:** setiap aksi admin (buat periode, anulir, kelola temuan/RTL/BA) tercatat.
- **Backup:** dump DB harian; ekspor Excel sebagai backup kedua.

---

## 13. Analitik, Laporan & Ekspor

| Laporan | Sumber | Format | Realtime |
|---------|--------|--------|----------|
| Ringkasan per respons | `Respons` + hitung | PDF 1 halaman (identitas + skor dimensi + kategori) | — |
| Rekap per Dimensi + Nilai Akhir | Agregasi per kelompok & dimensi (§9.6) | Excel 2 sheet + PDF | SSE: rekap live |
| Daftar jawaban mentah | `JawabanSkala` join `Butir` | Excel (satu sheet per jenis angket) | — |
| Jawaban terbuka | `JawabanTerbuka` | Excel (kolom Q21–Q25) | — |
| Berita Acara (Lamp. VIII, tanpa ttd) | `BeritaAcara` + rekap + temuan | PDF dengan kop UIN | — |
| RTL (Tbl 26) | `RTL` + `Temuan` | Excel + PDF | — |
| Statistik visual | Agregasi | Chart di dashboard (SSE live) | SSE: dashboard live |

Semua ekspor menghormati filter yang aktif (periode/fakultas/kategori).

---

## 14. Spesifikasi UI/UX (Mobile-First, Elegan, Efisien)

### 14.1 Prinsip Visual

- **Elegan:** palet dominan putih + **hijau UIN** (#0F5132 / #157347) + aksen emas lembut (#C5A253) untuk header/CTA; tipografi Inter/Poppins; radius 16px; shadow halus; tidak ramai.
- **Efisien:** satu tugas per layar (wizard), progress bar di atas, CTA sticky di bawah, transisi 150ms, tanpa animasi berlebihan.
- **Fokus HP:** kartu butir vertikal, opsi skala sebagai **segmented control 1–5** yang besar; identitas sebagai form pendek dengan dropdown searchable.

### 14.2 Komponen Kunci

- **Kartu Pilih Angket (landing):** ikon, judul, badge "18 butir • ±4 menit", deskripsi 1 baris, tombol "Isi Sekarang".
- **Stepper:** `Identitas → Input → Proses → Output → Terbuka → Tinjau` — titik-titik + label, current step highlighted.
- **Kartu Butir:** nomor + teks pernyataan + 5 chip (1–5) + label kategori dinamis di bawah chip terpilih.
- **Textarea Terbuka:** label pertanyaan + textarea + counter.
- **Ringkasan Skor (terima kasih):** 3 kartu metrik (Input/Proses/Output) + kartu besar Nilai Akhir & badge Kategori warna (hijau→merah).

### 14.3 Warna Kategori

| Kategori | Warna Badge |
|----------|-------------|
| Sangat Baik | #16A34A (hijau) |
| Baik | #65A30D (lime) |
| Cukup | #CA8A04 (kuning) |
| Kurang | #EA580C (oranye) |
| Sangat Kurang | #DC2626 (merah) |

---

## 15. Teknologi — Stack Final (18-08-2026)

> **Keputusan stack:** Express.js (backend) + React (frontend) + MySQL + SSE (realtime) — Bahasa **TypeScript** di kedua sisi.

| Lapisan | Teknologi | Keterangan |
|---------|-----------|------------|
| **Backend** | **Express.js 4+ (TypeScript)** | REST API, validasi Zod, auth JWT httpOnly cookie, SSE endpoint |
| **Frontend** | **React 18 + Vite + React Router** | SPA, Tailwind CSS + shadcn/ui, mobile-first |
| **Database** | **MySQL 8 + Prisma ORM** | Relasional; `provider = "mysql"` di `schema.prisma`; agregasi rekap via Prisma/SQL |
| **Realtime** | **Server-Sent Events (SSE)** | Satu arah server→client untuk update admin real-time (respons baru, rekap, dashboard). Endpoint `GET /api/events` dengan `Content-Type: text/event-stream`. Alternatif polling sebagai fallback |
| **Auth** | JWT httpOnly cookie (custom) | 2 role: `SUPER_ADMIN` / `ADMIN_MONEV`; bcrypt, rate-limit |
| **Validasi** | Zod | Identitas & skor 1–5, validasi SSE query |
| **State/Data Fetch** | TanStack Query (React Query) | Cache + refetch + sinkron dengan SSE |
| **PDF** | `pdf-lib` | Generate BA & ringkasan tanpa headless browser |
| **Excel** | `exceljs` | Ekspor rekap & jawaban mentah |
| **Deploy** | VPS + PM2 + Nginx | Reverse proxy, SSE butuh `proxy_buffering off` & `chunked_transfer_encoding on` |
| **Monorepo** | `server/` + `client/` + `prisma/` (shared) | Satu repo, dua app |

### Arsitektur

```
[ React (Vite) ]  ←—SSE—  [ Express API ]  ←→  [ MySQL (Prisma) ]
   :5173 / :3000 (prod)      :4000                :3306
        ↕ REST (JSON)             ↕ Prisma
   [ Nginx ] — static client + proxy /api & /events
```

- **SSE** dipakai untuk: dashboard admin (respons masuk), rekap live, notifikasi periode.
- Client buka `EventSource("/api/events?periodeId=...")`; server broadcast via in-memory `EventEmitter` (cukup untuk single-instance; fase 2 bisa ganti Redis Pub/Sub jika multi-instance).
- Validasi & rumus penilaian (§10.3) tetap di server; client hanya render.

> **Catatan OfficeCLI:** Skill `officecli` tetap terinstal (`.claude/skills/officecli/SKILL.md`, binary v1.0.144) dan dipakai untuk ekstraksi dokumen sumber. Tidak diperlukan untuk runtime website.

---

## 16. Roadmap & Milestone

| Fase | Durasi | Deliverable | Kriteria Selesai |
|------|--------|-------------|------------------|
| **0. Setup** | 2 hari | Monorepo `server/` (Express + Prisma MySQL) + `client/` (React + Vite + Tailwind), Prisma `provider = "mysql"`, seed Fakultas/Prodi dari SK + 6 template angket (120 butir), SSE `EventEmitter` + `/api/events` | `npm run dev` (concurrent server+client) jalan, DB seeded, SSE handshake OK |
| **1. Responden (inti)** | 5–7 hari | Landing + 6 wizard angket + identitas (Nama/Jabatan/Unit + Prodi/Fakultas khusus FAK/MHS) + skala 1–5 + terbuka + review + terima kasih + auto-save + hitung skor | Semua 6 angket dapat diisi di HP, skor & kategori benar |
| **2. Admin — Auth & CRUD** | 3–4 hari | Login JWT, role, manajemen periode (multi aktif), daftar & detail respons, filter, anulir | Admin dapat kelola periode & lihat respons |
| **3. Rekap & Ekspor + SSE** | 3–4 hari | Rekap per Dimensi + Nilai Akhir (§9.6, dimensi dibedakan), dashboard chart live via SSE, ekspor Excel 2 sheet + PDF | Ekspor sesuai format, rekap & dashboard update realtime tanpa refresh |
| **4. Temuan, RTL & BA** | 3 hari | Modul Temuan (Tbl 6), RTL (Tbl 26), generator BA (Lamp. VIII tanpa ttd) | BA & RTL dapat di-generate & dicetak |
| **5. Polish & QA** | 3–4 hari | Responsive QA (HP nyata), a11y, performa, audit log, SSE reconnect & fallback polling | Lighthouse ≥90, SSE stabil, 0 bug kritis |
| **6. Deploy & Serah** | 1–2 hari | VPS + PM2 + Nginx (`proxy_buffering off` untuk SSE), panduan admin, handover | URL live, SSE live di produksi, akun Super Admin diserahkan |

**Total estimasi MVP: 3–4 minggu** (1 developer full-time).

---

## 17. Kriteria Penerimaan (Acceptance Criteria)

**Responden:**
- [ ] 6 jenis angket tampil sesuai Pedoman (teks pernyataan verbatim, urutan dimensi benar).
- [ ] Skala 1–5 berfungsi, wajib isi sebelum lanjut dimensi, hint kategori (Tbl 3) tersedia.
- [ ] Identitas per jenis angket sesuai §8.2, dropdown Fakultas/Prodi/Jabatan terisi dari master SK.
- [ ] 5 pertanyaan terbuka tampil di akhir, opsional, tersimpan.
- [ ] Auto-save bekerja; refresh tidak hilangkan jawaban; submit menghasilkan halaman terima kasih dengan skor & kategori yang benar (verifikasi rumus manual).
- [ ] Tampilan di HP 360px tanpa scroll horizontal, tap target ≥44px.

**Admin:**
- [ ] Login membedakan SUPER_ADMIN vs ADMIN_MONEV.
- [ ] CRUD periode (draft/aktif/tutup), hanya periode aktif menerima respons.
- [ ] Daftar respons dapat difilter (periode/jenis/fakultas/kategori) & diekspor Excel.
- [ ] Detail respons menampilkan skor per dimensi & nilai akhir yang cocok dengan hitung manual.
- [ ] Rekap Tbl 24 menampilkan rata-rata per kelompok + baris Rata-rata, ekspor Excel/PDF.
- [ ] Modul Temuan (Mayor/Minor/Observasi) & RTL (PIC/Waktu/Status) CRUD.
- [ ] Generator BA menghasilkan PDF sesuai Lamp. VIII (nilai & kategori terisi otomatis).
- [ ] Admin tidak dapat edit jawaban submitted (hanya anulir dengan alasan yang tercatat di audit log).

**Umum:**
- [ ] Tidak ada butir hilang (120 skala + 5 terbuka = 125 item terverifikasi).
- [ ] Ekspor Excel/PDF dapat dibuka di Office tanpa error.
- [ ] Lighthouse Performance ≥90, Accessibility ≥95 di halaman publik.

---

## 18. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Pedoman direvisi (butir berubah) | Instrumen tidak selaras | Template angket versioned; edit butir butuh konfirmasi Super Admin + audit |
| Responden salah pilih jenis angket | Data salah kelompok | Deskripsi kartu angket jelas + konfirmasi "Anda akan mengisi angket X untuk Y" sebelum mulai |
| Pengisian di HP terputus (sinyal) | Kehilangan jawaban | Auto-save server + localStorage + tombol "Lanjutkan" saat kembali |
| Anonim vs akuntabilitas (MHS) | Dilema privasi | Opsi inisial/anonim untuk MHS; admin lihat nama/inisial apa adanya, tidak ada paksaan NIK |
| Rekap salah rumus | Laporan salah kategori | Unit test untuk `nilaiDimensi` & `kategori`; verifikasi manual 3 sampel per jenis |

---

## 19. Lampiran — Matriks Traceability (Pedoman → Fitur)

| Sumber Pedoman | Elemen | Fitur App |
|----------------|--------|-----------|
| BAB I.C (8 tujuan) | KPI Monev | §3.2, dashboard & rekap |
| BAB II Tbl 1 | Ruang lingkup Input/Proses/Output | Struktur dimensi angket |
| BAB II Tbl 2 | 8 pihak responden | 6 angket + 2 viewer (pimpinan) |
| BAB III.A | Metode (angket + telaah + wawancara + observasi) | MVP: angket; Fase 2: telaah/wawancara/observasi |
| BAB III.B (6 tahapan) | Tahapan Monev | Status periode (Perencanaan→Tindak Lanjut) |
| BAB III.C Tbl 3 | Skala 1–5 | Opsi radio per butir + hint |
| BAB III.D Tbl 4 | Rumus & kategori | §10.3 + ringkasan skor + badge |
| BAB IV Tbl 5 | Indikator & bukti | Field upload bukti (Fase 2) |
| BAB V klasifikasi | Mayor/Minor/Observasi | Modul Temuan |
| BAB V Tbl 6 | Format temuan | Form Temuan |
| BAB V Tbl 7 & Lamp. IX Tbl 26 | RTL | Modul RTL |
| Lamp. I–VI Tbl 8–23 | 120 butir | 6 template angket |
| Lamp. VII Q21–25 | 5 pertanyaan terbuka | Textarea di akhir wizard |
| Lamp. VII Tbl 24 | Format rekap | `/admin/rekap` |
| Lamp. VIII + Tbl 25 | Berita Acara | Generator BA |
| SK 1699/2025 | Daftar Tim & jabatan | Master Fakultas/Prodi/Jabatan seed |

---

## 20. Keputusan Desain — Final (18-08-2026)

| # | Topik | Keputusan |
|---|-------|-----------|
| 1 | **Identitas** | **Nama + Jabatan + Unit untuk semua responden**, ditambah **Prodi + Fakultas khusus FAK & MHS**. |
| 2 | **Dimensi rekap** | **Dibedakan sesuai nama asli di Pedoman** — tidak disamaratakan ke Input/Proses/Output bila namanya memang beda (klarifikasi 18-08-2026). |
| 3 | **Rata-rata rekap** | Rata-rata dari **semua respons** (bukan rata-rata kelompok). |
| 4 | **Periode** | **Multi periode aktif** didukung. |
| 5 | **Link angket** | **Link publik** (tanpa token). |
| 6 | **Berita Acara** | **Tanpa tanda tangan** — PDF siap cetak saja. |
| 7 | **Bahasa** | **Indonesia** saja. |

### Rincian Poin 2 — Dimensi Dibedakan (klarifikasi 18-08-2026)

Sesuai arahan "bedakan saja dimensinya kalo berbeda", rekap tidak memaksa semua kelompok ke kolom Input/Proses/Output:

| Kelompok | Dimensi Sesuai Pedoman | Kolom di Rekap |
|----------|----------------------|---------------|
| UNIV | Input, Proses, Output | Input / Proses / Output |
| FAK | Input, Proses, Output | Input / Proses / Output |
| ASESOR | Input, **Proses Asesmen**, Output | Input / Proses Asesmen / Output |
| **SEK** | **Administrasi & Pelayanan** (satu dimensi, 10 butir) | **Administrasi & Pelayanan** |
| LPM | Input, Proses, Output | Input / Proses / Output |
| **MHS** | **Informasi & Pendaftaran**, **Proses Asesmen**, **Hasil Rekognisi** | **Informasi & Pendaftaran / Proses Asesmen / Hasil Rekognisi** |

Implementasi rekap (§9.6): **tabel "Rekap per Dimensi"** menampilkan dimensi dengan nama aslinya per kelompok, dan **tabel "Rekap Nilai Akhir"** menampilkan nilai akhir & kategori per kelompok — keduanya diekspor ke Excel 2 sheet + PDF.

---

## Referensi File

- `Pedoman_Monev_RPL_UIN_Raden_Fatah_Palembang_2026.docx` — Pedoman lengkap, diekstrak via `officecli` (outline + 26 tabel + annotated view).
- `27082025-SK TIM PENGELOLA RPL.pdf` — SK Rektor No. 1699/2025, 11 halaman, diekstrak via PyMuPDF.
- Skill OfficeCLI terinstal: `.claude/skills/officecli/SKILL.md` (global `~/.claude/skills/officecli/SKILL.md`, binary v1.0.144).

---

*PRD v1.2 — FULLY FINAL (18-08-2026) — semua 7 poin terkunci. Siap masuk fase Setup & seeding data.*
