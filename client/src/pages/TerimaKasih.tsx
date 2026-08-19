import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function TerimaKasih() {
  const { kode } = useParams();
  const loc = useLocation() as any;
  const data = loc.state as { nilaiAkhir?: number; kategori?: string; tindakLanjut?: string; nilaiPerDimensi?: Record<string, number> } | null;

  const kategoriTone: Record<string, string> = {
    "Sangat Baik": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Baik": "bg-blue-100 text-blue-700 border-blue-200",
    "Cukup": "bg-amber-100 text-amber-700 border-amber-200",
    "Kurang": "bg-orange-100 text-orange-700 border-orange-200",
    "Sangat Kurang": "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-8 h-8 object-contain rounded-lg" />
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg hidden sm:flex items-center justify-center text-white shadow-sm"><CheckCircle2 size={18} /></span>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Monev RPL</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 min-h-[80vh] flex items-center justify-center px-4 py-10 animate-fade-in-up">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-xl w-full text-center">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slight">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Survei Berhasil Dikirim!</h1>
          <p className="text-slate-600 text-lg mt-3 leading-relaxed">
            Terima kasih telah meluangkan waktu untuk berpartisipasi. Angket <b className="text-slate-800">{kode}</b> Anda berhasil terekam dan sangat berarti bagi peningkatan mutu RPL.
          </p>
          {data?.nilaiAkhir != null && (
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Nilai Akhir</span>
                <span className="font-bold text-slate-900 text-base">{Math.round((data.nilaiAkhir as number) * 100) / 100} <span className="text-xs font-normal text-slate-400">/ 100</span></span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${Math.min(100, data.nilaiAkhir as number)}%` }} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Kategori</span>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${kategoriTone[data.kategori ?? ""] ?? "bg-slate-100 border-slate-200 text-slate-700"}`}>{data.kategori ?? "—"}</span>
              </div>
              {data?.tindakLanjut && <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">Tindak lanjut: <b className="text-slate-700">{data.tindakLanjut}</b></p>}
              {data?.nilaiPerDimensi && (
                <div className="pt-3 border-t border-slate-200 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Per dimensi</p>
                  {Object.entries(data.nilaiPerDimensi).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 px-3 bg-white rounded-xl border border-slate-200 text-sm">
                      <span className="text-slate-600">{k}</span><span className="font-bold text-slate-800">{Math.round(v * 100) / 100}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-8 py-4 rounded-xl font-bold transition-colors text-center">
              Kembali ke Beranda
            </Link>
            <Link to={`/angket/${kode}`} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 text-center">
              Isi lagi
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">Link angket tetap aktif selama periode dibuka. Skor skala 1–4.</p>
        </div>
      </div>
      <footer className="py-6 text-center text-slate-400 text-sm font-medium"><p>&copy; {new Date().getFullYear()} Monev RPL — UIN Raden Fatah Palembang.</p></footer>
    </div>
  );
}
