import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

export default function TerimaKasih() {
  const { kode } = useParams();
  const loc = useLocation() as any;
  const data = loc.state as { nilaiAkhir?: number; kategori?: string; tindakLanjut?: string; nilaiPerDimensi?: Record<string, number> } | null;
  const [stage, setStage] = useState<"loading" | "done">("loading");

  useEffect(() => {
    const t = setTimeout(() => setStage("done"), 1600);
    return () => clearTimeout(t);
  }, []);

  if (stage === "loading") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-transparent flex-1 gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" style={{ animationDuration: "0.9s" }} />
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 animate-pulse">
            <i className="fa-solid fa-paper-plane text-lg" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-extrabold text-slate-700">Mengirim jawaban Anda...</p>
          <p className="text-xs text-slate-400">Mohon tunggu, kami menyimpan respons angket <b className="text-indigo-600">{kode}</b></p>
          <div className="flex justify-center gap-1 pt-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  const kategoriTone: Record<string, string> = {
    "Sangat Baik": "bg-emerald-600",
    "Baik": "bg-indigo-600",
    "Cukup": "bg-amber-500",
    "Kurang": "bg-orange-500",
    "Sangat Kurang": "bg-rose-600",
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-transparent flex-1">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10 text-center space-y-5 animate-[in_0.45s_ease-out]">
        <style>{`@keyframes in{from{opacity:0;transform:translateY(10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes pop{0%{transform:scale(0.6)}60%{transform:scale(1.08)}100%{transform:scale(1)}} @keyframes ring{0%{transform:scale(0.85);opacity:0.9}100%{transform:scale(1.35);opacity:0}}`}</style>

        {/* Success icon with animated ring */}
        <div className="relative w-20 h-20 mx-auto">
          <span className="absolute inset-0 rounded-[1.25rem] bg-emerald-100" style={{ animation: "ring 1.4s ease-out 0.2s 2" }} />
          <div className="relative w-20 h-20 rounded-[1.25rem] bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-200" style={{ animation: "pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <i className="fa-solid fa-check" />
          </div>
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md"><i className="fa-solid fa-sparkles" /></span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terima kasih!</h1>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">Angket <b className="text-slate-800">{kode}</b> Anda berhasil dikirim dan terekam. Jawaban Anda sangat berarti untuk peningkatan mutu RPL.</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Tersimpan · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {data?.nilaiAkhir != null && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Nilai Akhir</span>
              <b className="text-base text-slate-900">{Math.round(data.nilaiAkhir * 100) / 100} <span className="text-xs font-normal text-slate-400">/ 100</span></b>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, data.nilaiAkhir)}%` }} />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Kategori</span>
              <span className={`px-3 py-1 text-white rounded-lg text-xs font-bold ${kategoriTone[data.kategori ?? ""] ?? "bg-slate-700"}`}>{data.kategori}</span>
            </div>
            {data.nilaiPerDimensi && (
              <div className="text-xs text-slate-600 pt-3 border-t border-slate-200 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Per dimensi</p>
                {Object.entries(data.nilaiPerDimensi).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 px-3 bg-white rounded-xl border border-slate-200">
                    <span>{k}</span><span className="font-bold text-slate-800">{Math.round(v * 100) / 100}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Link to="/" className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold text-center transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-house text-xs" /> Beranda
          </Link>
          <Link to={`/angket/${kode}`} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold text-center shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2">
            Isi lagi <i className="fa-solid fa-arrow-right text-xs" />
          </Link>
        </div>
        <p className="text-[11px] text-slate-400">Link angket tetap aktif selama periode dibuka. Data skala 1–4.</p>
      </div>
    </div>
  );
}
