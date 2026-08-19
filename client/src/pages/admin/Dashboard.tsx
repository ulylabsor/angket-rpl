import { useEffect, useMemo, useState } from "react";
import { Users, Star, BarChart3, ClipboardList } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../lib/sse";

type Periode = { id: string; nama: string; status?: string };

const KAT_META: Record<string, { bg: string; dot: string }> = {
  "Sangat Baik": { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  "Baik": { bg: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  "Cukup": { bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  "Kurang": { bg: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500" },
  "Sangat Kurang": { bg: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500" },
};
function tone(v: number | null) { if (v == null) return "text-slate-400"; if (v >= 86) return "text-emerald-600"; if (v >= 76) return "text-blue-600"; if (v >= 66) return "text-amber-600"; if (v >= 51) return "text-orange-600"; return "text-rose-600"; }

export default function Dashboard() {
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Periode[]>("/periode").then((ps) => {
      setPeriodeList(ps);
      const a = (ps as any).find((p: any) => p.status === "aktif") ?? ps[0];
      if (a) setPeriodeId(a.id);
    });
  }, []);

  const load = () => {
    if (!periodeId) return;
    setLoading(true);
    apiFetch(`/dashboard?periodeId=${periodeId}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [periodeId]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());

  const totalResponden = data?.total ?? 0;
  const avgRaw = useMemo(() => {
    const arr: any[] = data?.byTemplate ?? [];
    const avgs = arr.map((x) => x.avgNilai).filter((v: any) => v != null) as number[];
    if (!avgs.length) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }, [data]);
  const avgDisplay = avgRaw != null ? avgRaw.toFixed(1) : "—";
  const indeksPersen = avgRaw != null ? Math.round(avgRaw) : 0;
  const byTemplate: any[] = data?.byTemplate ?? [];
  const byKategori: any[] = data?.byKategori ?? [];
  // breakdown per instrumen as "dimensi" for SurveyFlow bars
  const breakdown = useMemo(() => {
    return byTemplate.map((r: any) => {
      const pct = r.avgNilai != null ? Math.min(100, Math.max(0, Number(r.avgNilai))) : 0;
      const score4 = r.avgNilai != null ? (Number(r.avgNilai) / 25) : 0; // 0-4
      return { id: r.kode, title: r.label ?? r.kode, count: r.count, avgNilai: r.avgNilai, pct, score4 };
    });
  }, [byTemplate]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ringkasan Eksekutif</h2>
          <p className="text-slate-500 mt-1 text-sm">Performa layanan berdasarkan umpan balik pengguna. Live via SSE.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 min-w-[180px]">
            <option value="">Pilih periode</option>
            {periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${loading ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} /> {loading ? "Memperbarui…" : "Sinkron"}
          </span>
        </div>
      </div>

      {/* Overview Cards — SurveyFlow 1:1 (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Users size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Responden</p>
            <h4 className="text-4xl font-extrabold text-slate-900">{totalResponden}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0"><Star size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Skor Rata-rata</p>
            <h4 className="text-4xl font-extrabold text-slate-900">{avgDisplay} <span className="text-lg text-slate-400 font-medium">/ 100</span></h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><BarChart3 size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Indeks Kepuasan</p>
            <h4 className="text-4xl font-extrabold text-slate-900">{indeksPersen}<span className="text-lg text-slate-400 font-medium">%</span></h4>
          </div>
        </div>
      </div>

      {/* Breakdown per Instrumen — SurveyFlow per Dimensi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3"><ClipboardList size={24} className="text-indigo-600" /> Capaian per Instrumen</h3>
        <p className="text-sm text-slate-500 mt-1">Rata-rata skor tiap jenis angket pada periode terpilih.</p>
        {!byTemplate.length ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 mt-8">
            <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Belum ada data survei yang masuk.</p>
            <p className="text-xs text-slate-400 mt-1">Pilih periode lain atau tunggu respons masuk.</p>
          </div>
        ) : (
          <div className="space-y-8 mt-8">
            {breakdown.map((r) => {
              const pct = r.pct;
              return (
                <div key={r.id} className="relative">
                  <div className="flex justify-between items-end mb-2 gap-4">
                    <div className="pr-4 min-w-0">
                      <span className="text-xs font-bold text-indigo-500 tracking-wider uppercase block mb-1">{r.count} Respons · {r.id}</span>
                      <span className="font-semibold text-slate-800 text-lg truncate">{r.title}</span>
                    </div>
                    <div className="text-right flex items-baseline gap-2 shrink-0">
                      <span className={`text-3xl font-extrabold ${tone(r.avgNilai)}`}>{r.avgNilai != null ? Number(r.avgNilai).toFixed(1) : "—"}</span>
                      <span className="text-sm text-slate-500 font-medium">/ 100</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className={`h-4 rounded-full transition-all duration-700 ease-out relative ${pct >= 76 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : pct >= 50 ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-red-400 to-red-500"}`} style={{ width: `${pct}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sebaran Kategori + Aktivitas Terbaru — keep existing but SurveyFlow cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center"><ClipboardList size={16} /></span> Sebaran Kategori Mutu</h3>
          <p className="text-xs text-slate-500 mt-1">Distribusi capaian responden.</p>
          <div className="mt-6 space-y-4">
            {byKategori.length ? byKategori.slice().sort((a: any,b:any)=>b.count-a.count).map((k: any) => {
              const m = KAT_META[k.kategori] ?? { bg: "bg-slate-50 border-slate-200 text-slate-600", dot: "bg-slate-400" };
              const pct = totalResponden ? Math.round((k.count/totalResponden)*100) : 0;
              return (
                <div key={k.kategori}>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${m.bg}`}><span className={`w-2 h-2 rounded-full ${m.dot}`} /> {k.kategori}</span>
                    <span className="text-xs font-black text-slate-800">{k.count} <span className="font-semibold text-slate-500">· {pct}%</span></span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden p-1">
                    <div className={`h-full rounded-full ${m.dot}`} style={{ width: `${(k.count/Math.max(1,totalResponden))*100}%` }} />
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-400 text-center py-6">Belum ada data.</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-800">Aktivitas Terbaru</h3><p className="text-xs text-slate-500">5 respons terbaru — live via SSE.</p></div>
          <div className="divide-y divide-slate-100 flex-1">
            {(data?.latest ?? []).length ? (data.latest as any[]).map((r: any) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-black text-xs shrink-0">{String((r.identitas as any)?.nama ?? "?").charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{(r.identitas as any)?.nama ?? "—"} <span className="text-xs font-normal text-slate-400">· {r.templateKode}</span></div>
                    <div className="text-xs text-slate-500 truncate">{(r.identitas as any)?.unit ?? (r.identitas as any)?.jabatan ?? "—"}</div>
                  </div>
                </div>
                <span className={`text-sm font-black ${tone(r.nilaiAkhir)}`}>{r.nilaiAkhir != null ? Math.round(r.nilaiAkhir) : "—"}<span className="text-xs font-semibold text-slate-400">/100</span></span>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-10">Belum ada respons.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
