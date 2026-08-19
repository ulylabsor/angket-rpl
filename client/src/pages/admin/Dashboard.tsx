import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../lib/sse";

type Periode = { id: string; nama: string; status?: string };

const KAT_COLOR: Record<string, { bg: string; text: string; dot: string; bar: string; soft: string }> = {
  "Sangat Baik": { bg: "bg-emerald-500", text: "text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500", soft: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  "Baik": { bg: "bg-blue-500", text: "text-blue-700", dot: "bg-blue-500", bar: "bg-blue-500", soft: "bg-blue-50 border-blue-200 text-blue-700" },
  "Cukup": { bg: "bg-amber-500", text: "text-amber-700", dot: "bg-amber-500", bar: "bg-amber-500", soft: "bg-amber-50 border-amber-200 text-amber-700" },
  "Kurang": { bg: "bg-orange-500", text: "text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500", soft: "bg-orange-50 border-orange-200 text-orange-700" },
  "Sangat Kurang": { bg: "bg-rose-500", text: "text-rose-700", dot: "bg-rose-500", bar: "bg-rose-500", soft: "bg-rose-50 border-rose-200 text-rose-700" },
};

function katStyle(label: string) {
  return KAT_COLOR[label] ?? { bg: "bg-slate-400", text: "text-slate-600", dot: "bg-slate-400", bar: "bg-slate-400", soft: "bg-slate-50 border-slate-200 text-slate-600" };
}
function scoreTone(v: number | null) {
  if (v == null) return "text-slate-400";
  if (v >= 86) return "text-emerald-600";
  if (v >= 76) return "text-blue-600";
  if (v >= 66) return "text-amber-600";
  if (v >= 51) return "text-orange-600";
  return "text-rose-600";
}

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
    apiFetch(`/dashboard?periodeId=${periodeId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [periodeId]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());

  const totalAngket = 6;
  const totalResponden = data?.total ?? 0;
  const avgScoreRaw = useMemo(() => {
    const arr: any[] = data?.byTemplate ?? [];
    const avgs = arr.map((x) => x.avgNilai).filter((v: any) => v != null) as number[];
    if (!avgs.length) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }, [data]);
  const avgScore = avgScoreRaw != null ? avgScoreRaw.toFixed(1) : "—";
  const avgKategori = useMemo(() => {
    if (avgScoreRaw == null) return null;
    if (avgScoreRaw >= 86) return "Sangat Baik";
    if (avgScoreRaw >= 76) return "Baik";
    if (avgScoreRaw >= 66) return "Cukup";
    if (avgScoreRaw >= 51) return "Kurang";
    return "Sangat Kurang";
  }, [avgScoreRaw]);

  const byKategori: any[] = data?.byKategori ?? [];
  const byTemplate: any[] = data?.byTemplate ?? [];
  const latest: any[] = data?.latest ?? [];
  const maxKategori = Math.max(1, ...byKategori.map((x: any) => x.count));
  const maxTemplate = Math.max(1, ...byTemplate.map((x: any) => x.count));

  const selectedPeriode = periodeList.find((p) => p.id === periodeId);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-30" />
        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700">Live Monitoring</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold normal-case tracking-normal">{selectedPeriode?.nama ?? "Pilih periode"}</span>
            </div>
            <h1 className="mt-2 text-[22px] sm:text-[26px] font-black tracking-tight text-slate-900 leading-tight">Ringkasan Eksekutif</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Potret menyeluruh capaian Monev RPL — sebaran mutu, kinerja tiap instrumen, dan aktivitas terbaru. Data tersinkronisasi otomatis via SSE.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <i className="fa-regular fa-calendar text-slate-400" /> Periode: <b className="text-slate-800">{selectedPeriode?.nama ?? "—"}</b>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${avgKategori ? katStyle(avgKategori).soft + " border" : "bg-white border-slate-200 text-slate-600"}`}>
                <span className={`w-2 h-2 rounded-full ${avgKategori ? katStyle(avgKategori).dot : "bg-slate-400"}`} />
                Mutu rata-rata: {avgKategori ?? "—"}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${loading ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} /> {loading ? "Memperbarui…" : "Sinkron"}
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            <div className="flex gap-2">
              <select
                value={periodeId}
                onChange={(e) => setPeriodeId(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[180px]"
              >
                <option value="">Pilih periode</option>
                {periodeList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
              <button
                onClick={load}
                className="w-11 h-11 grid place-items-center bg-slate-900 text-white rounded-xl hover:bg-black shadow-md"
                title="Muat ulang"
              >
                <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Angket */}
        <div className="group relative overflow-hidden bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white grid place-items-center shadow-md shadow-indigo-200">
              <i className="fa-solid fa-file-lines" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">Instrumen</span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Total Angket</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalAngket}</span>
            <span className="text-xs font-semibold text-slate-500">jenis</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">UNIV · FAK · ASESOR · LPM · SEK · MHS</p>
        </div>

        {/* Total Responden */}
        <div className="group relative overflow-hidden bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white grid place-items-center shadow-md shadow-emerald-200">
              <i className="fa-solid fa-users" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Total Responden</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalResponden}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {byKategori.length ? `${byKategori.length} kategori` : "—"}
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            {byKategori.map((k: any, i: number) => (
              <div key={k.kategori} className={`${katStyle(k.kategori).bg} h-full`} style={{ width: `${(k.count / Math.max(1, totalResponden)) * 100}%`, opacity: 0.9 - i * 0.08 }} />
            ))}
            {!byKategori.length && <div className="h-full w-full bg-slate-100" />}
          </div>
        </div>

        {/* Rata-rata Skor */}
        <div className="relative overflow-hidden bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-md">
              <i className="fa-solid fa-star-half-stroke" />
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${avgKategori ? katStyle(avgKategori).soft : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              {avgKategori ?? "Belum ada data"}
            </span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Rata-rata Skor</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${scoreTone(avgScoreRaw)}`}>{avgScore}</span>
            <span className="text-xs font-semibold text-slate-500">/ 100</span>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${avgScoreRaw != null && avgScoreRaw >= 76 ? "bg-indigo-600" : avgScoreRaw != null && avgScoreRaw >= 66 ? "bg-amber-500" : "bg-slate-400"}`}
                style={{ width: `${avgScoreRaw != null ? Math.min(100, Math.max(4, avgScoreRaw)) : 4}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-bold tracking-widest uppercase text-slate-400">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Status Sistem */}
        <div className="relative overflow-hidden bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-800 to-slate-600" />
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 grid place-items-center text-slate-700">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status Sistem</p>
          <p className="mt-1 text-[15px] font-black text-emerald-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aktif & Normal
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 border border-slate-200 py-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">SSE</div>
              <div className="text-xs font-black text-emerald-700">Terhubung</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 py-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Anulir</div>
              <div className="text-xs font-black text-slate-800">{data ? "—" : "—"}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 py-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Periode</div>
              <div className="text-xs font-black text-slate-800 truncate px-1">{selectedPeriode ? "Aktif" : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution + Template performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Per Kategori — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center text-xs"><i className="fa-solid fa-layer-group" /></span>
                Sebaran Kategori Mutu
              </h3>
              <p className="text-xs text-slate-500 mt-1">Distribusi capaian responden berdasarkan kategori akhir.</p>
            </div>
            <span className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{totalResponden} responden</span>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {byKategori.length ? (
              byKategori
                .slice()
                .sort((a: any, b: any) => b.count - a.count)
                .map((r: any) => {
                  const s = katStyle(r.kategori);
                  const pct = totalResponden ? Math.round((r.count / totalResponden) * 100) : 0;
                  return (
                    <div key={r.kategori} className="group">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${s.soft}`}>
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {r.kategori}
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {r.count} <span className="font-semibold text-slate-500">· {pct}%</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 bg-slate-100 rounded-full overflow-hidden p-1">
                        <div className={`h-full rounded-full ${s.bg} transition-all`} style={{ width: `${(r.count / maxKategori) * 100}%` }} />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="h-full grid place-items-center py-10 text-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto text-slate-400">
                    <i className="fa-regular fa-chart-bar" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada sebaran kategori</p>
                  <p className="text-xs text-slate-400">Data akan muncul setelah ada respons masuk.</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-2">
            {[
              { l: "Sangat Baik", c: "bg-emerald-500" },
              { l: "Baik", c: "bg-blue-500" },
              { l: "Cukup", c: "bg-amber-500" },
              { l: "Kurang", c: "bg-orange-500" },
              { l: "Sangat Kurang", c: "bg-rose-500" },
            ].map((x) => (
              <span key={x.l} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className={`w-2 h-2 rounded-full ${x.c}`} /> {x.l}
              </span>
            ))}
          </div>
        </div>

        {/* Per Jenis Angket — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white grid place-items-center text-xs"><i className="fa-solid fa-chart-simple" /></span>
                Capaian per Instrumen
              </h3>
              <p className="text-xs text-slate-500 mt-1">Volume dan rata-rata skor tiap jenis angket pada periode terpilih.</p>
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{byTemplate.length} instrumen</span>
          </div>
          <div className="p-6 space-y-3 flex-1">
            {byTemplate.length ? (
              byTemplate
                .slice()
                .sort((a: any, b: any) => b.count - a.count)
                .map((r: any) => {
                  const pct = (r.count / maxTemplate) * 100;
                  const tone = scoreTone(r.avgNilai);
                  const fill = r.avgNilai != null ? Math.min(100, Math.max(6, r.avgNilai)) : 6;
                  return (
                    <div
                      key={r.kode}
                      className="group rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm p-4 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-xs font-black text-slate-700 shrink-0">
                            {r.kode.slice(0, 3)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 leading-tight truncate">{r.label}</div>
                            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{r.kode} • {r.count} respons</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${tone}`}>{r.avgNilai != null ? Number(r.avgNilai).toFixed(1) : "—"}</span>
                          <span className="text-xs font-semibold text-slate-400">/ 100</span>
                          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full border text-xs font-bold ${r.avgNilai != null && r.avgNilai >= 76 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.avgNilai != null && r.avgNilai >= 66 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-600"}`}>
                            {r.avgNilai != null ? (r.avgNilai >= 86 ? "Sangat Baik" : r.avgNilai >= 76 ? "Baik" : r.avgNilai >= 66 ? "Cukup" : r.avgNilai >= 51 ? "Kurang" : "Sangat Kurang") : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-center">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Volume</span>
                            <span>{r.count} dari {maxTemplate}</span>
                          </div>
                          <div className="h-1.5 bg-white border border-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="w-[92px] space-y-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Skor</div>
                          <div className="h-1.5 bg-white border border-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${r.avgNilai != null && r.avgNilai >= 76 ? "bg-emerald-500" : r.avgNilai != null && r.avgNilai >= 66 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${fill}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="h-full grid place-items-center py-10 text-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto text-slate-400">
                    <i className="fa-regular fa-file-lines" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada capaian instrumen</p>
                  <p className="text-xs text-slate-400">Pilih periode lain atau tunggu respons masuk.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white grid place-items-center text-xs"><i className="fa-solid fa-clock-rotate-left" /></span>
              Aktivitas Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-1">5 respons terbaru — diperbarui otomatis tanpa refresh.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live via SSE
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {latest.length ? (
            latest.map((r: any) => {
              const nama = String((r.identitas as any)?.nama ?? "—");
              const kategori = r.kategori ?? "—";
              const s = katStyle(kategori);
              const nilai = r.nilaiAkhir != null ? Math.round(r.nilaiAkhir) : null;
              return (
                <div key={r.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white grid place-items-center font-black text-sm shadow-sm shadow-indigo-200 shrink-0">
                      {nama.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate flex flex-wrap items-center gap-2">
                        <span className="truncate">{nama}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                          <i className="fa-regular fa-file-lines text-slate-400" /> {r.templateKode}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold ${s.soft}`}>{kategori}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-regular fa-clock text-slate-400" /> {new Date(r.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="truncate">{(r.identitas as any)?.unit ?? (r.identitas as any)?.jabatan ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <div className="text-right">
                      <div className={`text-sm font-black ${scoreTone(nilai)}`}>{nilai != null ? `${nilai}` : "—"} <span className="text-xs font-semibold text-slate-400">/ 100</span></div>
                      <div className="hidden sm:block h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
                        <div className={`h-full rounded-full ${nilai != null && nilai >= 76 ? "bg-emerald-500" : nilai != null && nilai >= 66 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${nilai != null ? Math.min(100, nilai) : 0}%` }} />
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex w-8 h-8 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200">
                      <i className="fa-solid fa-chevron-right text-xs" />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto text-slate-400">
                <i className="fa-regular fa-inbox" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada respons</p>
              <p className="text-xs text-slate-400">Aktivitas akan muncul di sini secara real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
