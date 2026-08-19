import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    apiFetch<Periode[]>("/periode").then((ps) => {
      setPeriodeList(ps);
      const aktif = ps.find((p) => p.status === "aktif") ?? ps[0];
      if (aktif) setPeriodeId(aktif.id);
    }).catch(() => {});
    apiFetch<AngketCard[]>("/angket").then(setAngketList).catch(() => {});
  }, []);

  return (
    <div className="min-h-full flex flex-col flex-1 bg-transparent">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo-radenfatah.png" alt="UIN Raden Fatah Palembang" className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="font-black text-slate-900 text-sm sm:text-[15px] leading-none tracking-tight">Monev RPL</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5 truncate">UIN Raden Fatah Palembang · RPL Tipe A</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="text-center max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Periode aktif
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">Pengisian Monev RPL</h1>
            <p className="text-slate-500 text-sm mt-1">Pilih periode aktif dan jenis angket sesuai peran Anda.</p>
          </div>
          <div className="mt-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Periode</label>
            <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium">
              {!periodeList.length && <option>Memuat...</option>}
              {periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama} — {p.tahun} ({p.status})</option>)}
            </select>
            {!periodeList.filter((p) => p.status === "aktif").length && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">Belum ada periode aktif. Hubungi admin.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-sm">Pilih Jenis Angket</h2>
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
                      <Link key={a.kode} to={periodeId ? `/angket/${a.kode}?periodeId=${periodeId}` : `/angket/${a.kode}`} className="group p-4 border border-slate-200 rounded-2xl flex justify-between items-center bg-slate-50 hover:bg-white hover:shadow-sm hover:border-indigo-200 transition-all">
                        <div className="flex gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <i className={`fa-solid ${m.icon} text-sm`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-sm leading-tight">{a.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.desc}</div>
                            <div className="text-xs text-slate-500 mt-1">{a.butirCount} pernyataan · skala 1–4</div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><i className="fa-solid fa-users text-[10px]" /> Responden: {m.responden}</div>
                          </div>
                        </div>
                        <span className="shrink-0 ml-3 px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200">Isi</span>
                      </Link>
                    );
                  })}
                  {!angketList.length && <div className="col-span-full text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">Memuat angket...</div>}
                </>
              );
            })()}
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400">Link angket publik — tanpa login. Identitas: Nama/Jabatan/Unit (+ Prodi/Fakultas untuk FAK & MHS).</p>
      </main>
    </div>
  );
}
