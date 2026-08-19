import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ChevronRight, Users, Info, X, ClipboardCheck, Timer, Shield, FileCheck, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

type Periode = { id: string; nama: string; tahun: number; status: string };
type AngketCard = { kode: string; nama: string; label: string; butirCount: number };

const META: Record<string, { icon: string; desc: string; responden: string }> = {
  UNIV: { icon: "fa-building-columns", desc: "Kebijakan, pedoman & kepemimpinan universitas", responden: "Rektor · Warek 1 · Ketua & Sekretaris Pengelola RPL Universitas" },
  FAK: { icon: "fa-graduation-cap", desc: "Pengelola RPL Fakultas / Pascasarjana / Prodi", responden: "Direktur & Wadir Pascasarjana · Dekan & Wadek 1 · Ketua Prodi" },
  LPM: { icon: "fa-magnifying-glass-chart", desc: "Pengawasan mutu & tindak lanjut", responden: "Tim LPM" },
  ASESOR: { icon: "fa-chalkboard-user", desc: "Profesionalisme & proses asesmen RPL", responden: "Tim Asesor RPL (Asesor 1 & 2)" },
  SEK: { icon: "fa-folder-open", desc: "Administrasi & pelayanan sekretariat", responden: "Sekretaris Prodi & Staf Administrasi Prodi" },
  MHS: { icon: "fa-user-graduate", desc: "Pengalaman & kepuasan pemohon RPL", responden: "Mahasiswa / Pemohon RPL (boleh inisial)" },
};

export default function Landing() {
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [angketList, setAngketList] = useState<AngketCard[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    apiFetch<Periode[]>("/periode").then((ps) => {
      setPeriodeList(ps);
      const aktif = ps.find((p) => p.status === "aktif") ?? ps[0];
      if (aktif) setPeriodeId(aktif.id);
    }).catch(() => {});
    apiFetch<AngketCard[]>("/angket").then(setAngketList).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header — SurveyFlow 1:1 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg hidden sm:flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all">
              <ShieldCheck size={18} />
            </div>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Monev RPL</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-500 ml-1">UIN Raden Fatah · Tipe A</span>
          </div>
          <button onClick={() => setInfoOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-colors bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-xl shadow-sm">
            <Info size={16} />
            <span className="hidden sm:inline">Info</span>
            <span className="sm:hidden">Info</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Welcome hero — 1:1 SurveyFlow */}
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-center animate-fade-in-up pt-4">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Monev RPL</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mt-4 leading-relaxed">
            Pengisian Monev RPL UIN Raden Fatah Palembang — pilih periode aktif dan jenis angket sesuai peran Anda. Pendapat Anda sangat berharga.
          </p>
        </div>

        {/* Periode card */}
        <div className="max-w-3xl mx-auto mt-8 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center"><i className="fa-solid fa-calendar text-[11px]" /></span>
              Periode
            </label>
            <span className="text-xs font-semibold text-slate-400">{periodeList.length ? `${periodeList.length} periode` : "memuat..."}</span>
          </div>
          <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-colors">
            {!periodeList.length && <option>Memuat...</option>}
            {periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama} — {p.tahun} ({p.status})</option>)}
          </select>
          {!periodeList.filter((p) => p.status === "aktif").length && periodeList.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation" /> Belum ada periode aktif. Hubungi admin.
            </p>
          )}
          {!periodeList.length && <p className="text-xs text-slate-400 mt-2">Hubungi admin jika periode belum tersedia.</p>}
        </div>

        {/* Pilih Jenis Angket — grid */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white grid place-items-center text-xs"><Users size={14} /></span>
              Pilih Jenis Angket
            </h2>
            <span className="text-xs text-slate-400">{angketList.length ? `${angketList.length} jenis responden` : ""}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(() => {
              const ORDER = ["UNIV", "FAK", "LPM", "ASESOR", "SEK", "MHS"];
              const sorted = [...angketList].sort((a, b) => ORDER.indexOf(a.kode) - ORDER.indexOf(b.kode));
              return (
                <>
                  {sorted.map((a) => {
                    const m = META[a.kode] ?? { icon: "fa-file-lines", desc: "", responden: "" };
                    return (
                      <Link key={a.kode} to={periodeId ? `/angket/${a.kode}?periodeId=${periodeId}` : `/angket/${a.kode}`} className="group bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all">
                        <div className="flex gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <i className={`fa-solid ${m.icon} text-sm`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-sm leading-tight">{a.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.desc}</div>
                            <div className="text-xs text-slate-500 mt-1">{a.butirCount} pernyataan · skala 1–4</div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><i className="fa-solid fa-users text-[10px]" /> {m.responden}</div>
                          </div>
                        </div>
                        <span className="shrink-0 ml-3 px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1">
                          Isi <ChevronRight size={14} />
                        </span>
                      </Link>
                    );
                  })}
                  {!angketList.length && <div className="col-span-full text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">Memuat angket...</div>}
                </>
              );
            })()}
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-4">Link angket publik — tanpa login. Identitas: Nama/Jabatan/Unit (+ Prodi/Fakultas untuk FAK &amp; MHS).</p>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm font-medium">
        <p>&copy; {new Date().getFullYear()} Monev RPL — UIN Raden Fatah Palembang. Desain Elegan &amp; Responsif.</p>
      </footer>

      {/* Info modal — tata cara + info */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Tutup" onClick={() => setInfoOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-white rounded-[1.75rem] shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            {/* header gradient */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 px-6 sm:px-8 pt-7 pb-8 text-white overflow-hidden shrink-0">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <button onClick={() => setInfoOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white transition-colors">
                <X size={18} />
              </button>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                  <Info size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Panduan Pengisian Angket</h3>
                  <p className="text-indigo-100 text-sm mt-1.5 leading-relaxed max-w-lg">Monev RPL Tipe A — UIN Raden Fatah Palembang. Dibaca sebelum mengisi.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 sm:px-8 py-6 space-y-6">
              {/* langkah */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center"><ClipboardCheck size={14} /></span>
                  Tata cara pengisian
                </h4>
                <ol className="mt-3 space-y-3">
                  {[
                    { n: "1", t: "Pilih Periode aktif di atas — tanpa periode angket tidak bisa dikirim." },
                    { n: "2", t: "Pilih jenis angket sesuai peran (UNIV / FAK / LPM / ASESOR / SEK / MHS)." },
                    { n: "3", t: "Isi Identitas: Nama, Jabatan, Unit. Untuk FAK & MHS wajib pilih Fakultas & Prodi." },
                    { n: "4", t: "Nilai tiap pernyataan skala 1–4: 1 Sangat Kurang · 2 Kurang · 3 Baik · 4 Sangat Baik." },
                    { n: "5", t: "Lengkapi semua dimensi, lalu isi Q21–Q25 (terbuka, opsional) bila ada masukan." },
                    { n: "6", t: "Cek Review, lalu Kirim. Data langsung masuk rekap & live via SSE ke admin." },
                  ].map((s) => (
                    <li key={s.n} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold grid place-items-center">{s.n}</span>
                      <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{s.t}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* skala */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-white grid place-items-center"><AlertCircle size={14} /></span>
                  Skala &amp; kategori mutu
                </h4>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <span className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-center">1 · Sangat Kurang</span>
                  <span className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-center">2 · Kurang</span>
                  <span className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-center">3 · Baik</span>
                  <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-center">4 · Sangat Baik</span>
                </div>
                <p className="text-xs text-slate-500 mt-3">Nilai agregat dikonversi ke 0–100 dan dikategorikan untuk laporan &amp; tindak lanjut.</p>
              </div>

              {/* info tambahan */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center"><Timer size={16} /></div>
                  <p className="text-sm font-bold text-slate-800 mt-3">Durasi</p>
                  <p className="text-xs text-slate-500 mt-1">±5–10 menit tergantung jenis angket.</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><Shield size={16} /></div>
                  <p className="text-sm font-bold text-slate-800 mt-3">Privasi</p>
                  <p className="text-xs text-slate-500 mt-1">Identitas hanya untuk rekap Monev, tidak dipublikasi perorangan.</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><FileCheck size={16} /></div>
                  <p className="text-sm font-bold text-slate-800 mt-3">Setelah kirim</p>
                  <p className="text-xs text-slate-500 mt-1">Terekam permanen &amp; tampil di dashboard admin.</p>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">Pilih angket sesuai peran agar data valid. Salah pilih? Kembali ke beranda dan pilih ulang — jawaban belum terkirim masih bisa diubah.</p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button onClick={() => setInfoOpen(false)} className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md">Mengerti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
