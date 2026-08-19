import { useEffect, useMemo, useState } from "react";
import { apiFetch, API } from "../../lib/api";
import { useSSE } from "../../lib/sse";

const KAT: Record<string, { chip: string; dot: string; bar: string; text: string }> = {
  "Sangat Baik": { chip: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700" },
  "Baik": { chip: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500", bar: "bg-blue-500", text: "text-blue-700" },
  "Cukup": { chip: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", bar: "bg-amber-500", text: "text-amber-700" },
  "Kurang": { chip: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500", text: "text-orange-700" },
  "Sangat Kurang": { chip: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500", bar: "bg-rose-500", text: "text-rose-700" },
};
function katOf(v: number | null | undefined) {
  if (v == null) return null;
  if (v >= 86) return "Sangat Baik";
  if (v >= 76) return "Baik";
  if (v >= 66) return "Cukup";
  if (v >= 51) return "Kurang";
  return "Sangat Kurang";
}
function tone(n: number | null | undefined) {
  if (n == null) return "text-slate-400";
  if (n >= 86) return "text-emerald-600";
  if (n >= 76) return "text-blue-600";
  if (n >= 66) return "text-amber-600";
  if (n >= 51) return "text-orange-600";
  return "text-rose-600";
}

const LABEL: Record<string, { title: string; short: string }> = {
  UNIV: { title: "Pengelola Universitas", short: "UNIV" },
  FAK: { title: "Fakultas / Pascasarjana", short: "FAK" },
  ASESOR: { title: "Asesor", short: "ASESOR" },
  SEK: { title: "Sekretariat", short: "SEK" },
  LPM: { title: "LPM", short: "LPM" },
  MHS: { title: "Mahasiswa / Pemohon", short: "MHS" },
};

const ORDER = ["UNIV", "FAK", "ASESOR", "SEK", "LPM", "MHS"] as const;

export default function RekapPage() {
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null); // for modal
  const [activeTab, setActiveTab] = useState<"dimensi" | "akhir">("dimensi");

  useEffect(() => {
    apiFetch<any[]>("/periode").then((ps) => {
      setPeriodeList(ps);
      const a = (ps as any).find((p: any) => p.status === "aktif") ?? ps[0];
      if (a) setPeriodeId(a.id);
    });
  }, []);
  const load = () => {
    if (!periodeId) return;
    apiFetch(`/rekap?periodeId=${periodeId}`).then(setData).catch(() => {});
  };
  useEffect(load, [periodeId]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());

  const perDimensi: any[] = data?.perDimensi ?? [];
  const perKelompok: any[] = data?.perKelompok ?? [];
  const ringkasan = data?.ringkasan;

  const groupedDimensi = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const r of perDimensi) {
      const k = r.kode as string;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return ORDER.map((kode) => ({ kode, label: LABEL[kode]?.title ?? kode, rows: m.get(kode) ?? [] })).filter((g) => g.rows.length);
  }, [perDimensi]);

  const selectedPeriode = periodeList.find((p) => p.id === periodeId);
  const totalRespons = ringkasan?.totalRespons ?? perKelompok.reduce((a: number, r: any) => a + (r.jumlahRespons ?? 0), 0);
  const rataAll = ringkasan?.rataRataSemua as number | null | undefined;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50" />
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30" />
        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-violet-700">Rekap Analitik</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold normal-case tracking-normal">{selectedPeriode?.nama ?? "Pilih periode"}</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 normal-case tracking-normal font-semibold">
                <i className="fa-solid fa-users text-slate-400 text-[11px]" /> {totalRespons} respons
              </span>
            </div>
            <h1 className="mt-2 text-[22px] sm:text-[26px] font-black tracking-tight text-slate-900 leading-tight">Rekap per Dimensi & Nilai Akhir</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Potret mutu per dimensi Input–Proses–Output dan rekap nilai akhir tiap kelompok responden — disajikan ringkas, mudah dipindai, dan siap untuk telaah tindak lanjut.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">
                <span className={`w-2 h-2 rounded-full ${rataAll != null && rataAll >= 76 ? "bg-emerald-400" : rataAll != null && rataAll >= 66 ? "bg-amber-400" : "bg-slate-400"}`} />
                Rata-rata semua: <b>{rataAll != null ? rataAll.toFixed(1) : "—"} / 100</b> {katOf(rataAll) ? `· ${katOf(rataAll)}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                <i className="fa-solid fa-bolt text-amber-500" /> Live via SSE
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={periodeId}
              onChange={(e) => setPeriodeId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-violet-500 min-w-[190px]"
            >
              <option value="">Pilih periode</option>
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
            {periodeId ? (
              <a href={API(`/exports/rekap/excel?periodeId=${periodeId}`)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200">
                <i className="fa-solid fa-file-excel" /> Export Excel
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold">Pilih periode</span>
            )}
          </div>
        </div>
      </div>

      {!data ? (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 grid place-items-center mx-auto text-violet-600"><i className="fa-solid fa-chart-simple" /></div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Pilih periode untuk melihat rekap</p>
          <p className="text-xs text-slate-400">Data agregasi akan tampil setelah periode dipilih.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Ringkasan Mutu Keseluruhan</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${tone(rataAll)}`}>{rataAll != null ? rataAll.toFixed(1) : "—"}</span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  {katOf(rataAll ?? null) && (
                    <span className={`ml-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${KAT[katOf(rataAll!)!].chip}`}>
                      <span className={`w-2 h-2 rounded-full ${KAT[katOf(rataAll!)!].dot}`} /> {katOf(rataAll!)}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden max-w-md">
                  <div className={`h-full rounded-full ${rataAll != null && rataAll >= 76 ? "bg-emerald-500" : rataAll != null && rataAll >= 66 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${rataAll != null ? Math.min(100, rataAll) : 0}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center min-w-[110px]">
                  <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Total Respons</div>
                  <div className="text-xl font-black text-slate-900">{totalRespons}</div>
                </div>
                <div className="rounded-2xl bg-violet-600 text-white px-4 py-3 text-center min-w-[110px] shadow-md shadow-violet-200">
                  <div className="text-[11px] font-bold tracking-widest uppercase text-violet-100">Kelompok</div>
                  <div className="text-xl font-black">{perKelompok.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Legenda Kategori</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(KAT).map(([label, s]) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${s.chip}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">Rentang: ≥86 Sangat Baik · 76–85 Baik · 66–75 Cukup · 51–65 Kurang · &lt;51 Sangat Kurang.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full w-fit border border-slate-200">
            <button
              onClick={() => setActiveTab("dimensi")}
              className={`px-5 py-2 rounded-full text-xs font-black transition ${activeTab === "dimensi" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}
            >
              <i className="fa-solid fa-layer-group mr-2" /> Per Dimensi
            </button>
            <button
              onClick={() => setActiveTab("akhir")}
              className={`px-5 py-2 rounded-full text-xs font-black transition ${activeTab === "akhir" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}
            >
              <i className="fa-solid fa-star mr-2" /> Nilai Akhir
            </button>
            <span className="hidden sm:inline-flex ml-1 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold">{activeTab === "dimensi" ? `${perDimensi.length} baris` : `${perKelompok.length} kelompok`}</span>
          </div>

          {activeTab === "dimensi" ? (
            <div className="space-y-4">
              {groupedDimensi.length ? groupedDimensi.map((group) => (
                <div key={group.kode} className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-black shrink-0">{group.kode.slice(0, 4)}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 leading-tight">{group.label}</div>
                        <div className="text-xs text-slate-500">{group.rows.length} dimensi • {group.rows[0]?.jumlahRespons ?? 0} respons</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                        <i className="fa-solid fa-users text-slate-400" /> {group.rows[0]?.jumlahRespons ?? 0} responden
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.rows.map((r: any) => {
                      const kat = r.kategori as string | null;
                      const s = kat ? KAT[kat] : null;
                      const nilai = r.nilaiAvg as number | null;
                      return (
                        <div key={`${r.kode}-${r.dimensi}`} className="group rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-sm p-4 transition flex flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-black tracking-widest uppercase text-slate-400">{r.kode} · {r.jumlahButir} butir</div>
                              <div className="text-[15px] font-black text-slate-900 leading-tight mt-1">{r.dimensi}</div>
                              <div className="text-xs text-slate-500 mt-1">{r.responden}</div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${s ? s.chip : "bg-white border-slate-200 text-slate-500"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s ? s.dot : "bg-slate-400"}`} /> {kat ?? "—"}
                            </span>
                          </div>
                          <div className="mt-4 flex items-baseline gap-2">
                            <span className={`text-2xl font-black ${tone(nilai)}`}>{nilai != null ? nilai.toFixed(1) : "—"}</span>
                            <span className="text-xs font-semibold text-slate-400">/ 100</span>
                            <span className="ml-auto text-xs font-semibold text-slate-500">n = {r.jumlahRespons}</span>
                          </div>
                          <div className="mt-2 h-2 bg-white border border-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s ? s.bar : "bg-slate-300"}`} style={{ width: `${nilai != null ? Math.min(100, nilai) : 0}%` }} />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => setSelected({ ...r, type: "dimensi" })}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black"
                            >
                              <i className="fa-regular fa-eye" /> Detail
                            </button>
                            <span className="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                              {r.jumlahButir} butir
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-[1.5rem] border border-slate-200 p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto text-slate-400"><i className="fa-regular fa-chart-bar" /></div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada rekap dimensi</p>
                  <p className="text-xs text-slate-400">Pilih periode lain atau tunggu respons masuk.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {perKelompok.map((r: any) => {
                  const kat = r.kategori as string | null;
                  const s = kat ? KAT[kat] : null;
                  const nilai = r.nilaiAkhirAvg as number | null;
                  return (
                    <div key={r.kode} className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm hover:shadow-md p-5 transition">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <span className="w-11 h-11 rounded-xl bg-violet-600 text-white grid place-items-center font-black shadow-md shadow-violet-200 shrink-0">{r.kode.slice(0, 3)}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold tracking-widest uppercase text-slate-400">{r.kode}</div>
                            <div className="text-[15px] font-black text-slate-900 leading-tight">{r.responden}</div>
                            <div className="text-xs text-slate-500">{r.jumlahRespons} respons</div>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${s ? s.chip : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s ? s.dot : "bg-slate-400"}`} /> {kat ?? "—"}
                        </span>
                      </div>
                      <div className="mt-5 flex items-baseline gap-2">
                        <span className={`text-3xl font-black ${tone(nilai)}`}>{nilai != null ? nilai.toFixed(1) : "—"}</span>
                        <span className="text-sm font-semibold text-slate-400">/ 100</span>
                      </div>
                      <div className="mt-2 h-2.5 bg-slate-100 rounded-full overflow-hidden p-1">
                        <div className={`h-full rounded-full ${s ? s.bar : "bg-slate-300"}`} style={{ width: `${nilai != null ? Math.min(100, nilai) : 0}%` }} />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => setSelected({ ...r, type: "akhir" })} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black">
                          <i className="fa-regular fa-eye" /> Lihat rincian
                        </button>
                        <span className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                          <i className="fa-solid fa-users text-slate-400" /> {r.jumlahRespons}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ringkasan && (
                <div className="relative overflow-hidden rounded-[1.5rem] border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-md shadow-violet-200 text-white">
                  <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/15 rounded-full blur-2xl" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-widest uppercase text-violet-100">Rata-rata Semua Respons</div>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-black">{ringkasan.rataRataSemua != null ? Number(ringkasan.rataRataSemua).toFixed(1) : "—"}</span>
                        <span className="text-sm font-semibold text-violet-100">/ 100</span>
                        {ringkasan.kategori && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-violet-700 text-xs font-black">{ringkasan.kategori}</span>}
                      </div>
                      <p className="mt-2 text-xs text-violet-100 max-w-xl">Agregat lintas seluruh kelompok responden pada periode terpilih — gunakan sebagai acuan mutu keseluruhan.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-2xl bg-white/15 border border-white/20 px-5 py-3 text-center backdrop-blur">
                        <div className="text-[11px] font-bold tracking-widest uppercase text-violet-100">Total</div>
                        <div className="text-xl font-black">{ringkasan.totalRespons}</div>
                        <div className="text-xs text-violet-100">respons</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${ringkasan.rataRataSemua != null ? Math.min(100, Number(ringkasan.rataRataSemua)) : 0}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full sm:max-w-[640px] max-h-[90vh] sm:max-h-[85vh] rounded-t-[1.75rem] sm:rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="relative overflow-hidden border-b border-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50" />
              <div className="relative p-5 sm:p-6 flex items-start justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white grid place-items-center font-black shrink-0">{String(selected.kode).slice(0, 3)}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400">{selected.kode} • {selected.responden}</div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{selected.type === "dimensi" ? selected.dimensi : "Nilai Akhir"}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${selected.kategori && KAT[selected.kategori] ? KAT[selected.kategori].chip : "bg-white border-slate-200 text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selected.kategori && KAT[selected.kategori] ? KAT[selected.kategori].dot : "bg-slate-400"}`} /> {selected.kategori ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                        {selected.type === "dimensi" ? `${selected.jumlahButir} butir` : `${selected.jumlahRespons} respons`}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-600 hover:bg-slate-50 shrink-0">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{selected.type === "dimensi" ? "Nilai Dimensi" : "Nilai Akhir Kelompok"}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${tone(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg)}`}>
                    {(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg) != null ? Number(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg).toFixed(1) : "—"}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${selected.kategori && KAT[selected.kategori] ? KAT[selected.kategori].chip : "bg-white border-slate-200 text-slate-500"}`}>
                    {selected.kategori ?? "—"}
                  </span>
                </div>
                <div className="mt-3 h-2 bg-white border border-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selected.kategori && KAT[selected.kategori] ? KAT[selected.kategori].bar : "bg-slate-300"}`}
                    style={{ width: `${(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg) != null ? Math.min(100, Number(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg)) : 0}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Jumlah Respons</div>
                    <div className="text-sm font-black text-slate-900">{selected.jumlahRespons}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{selected.type === "dimensi" ? "Jumlah Butir" : "Kelompok"}</div>
                    <div className="text-sm font-black text-slate-900">{selected.type === "dimensi" ? `${selected.jumlahButir} butir` : selected.responden}</div>
                  </div>
                </div>
              </div>

              {selected.type === "dimensi" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-500">Konteks Dimensi</h4>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4 py-2 border-b border-slate-100"><dt className="text-slate-500">Kelompok responden</dt><dd className="font-semibold text-slate-900 text-right">{selected.responden} ({selected.kode})</dd></div>
                    <div className="flex justify-between gap-4 py-2 border-b border-slate-100"><dt className="text-slate-500">Dimensi</dt><dd className="font-semibold text-slate-900 text-right">{selected.dimensi}</dd></div>
                    <div className="flex justify-between gap-4 py-2 border-b border-slate-100"><dt className="text-slate-500">Butir instrumen</dt><dd className="font-semibold text-slate-900">{selected.jumlahButir}</dd></div>
                    <div className="flex justify-between gap-4 py-2"><dt className="text-slate-500">Basis perhitungan</dt><dd className="font-semibold text-slate-900 text-right">Rata-rata {selected.jumlahRespons} respons</dd></div>
                  </dl>
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs leading-relaxed text-amber-900">
                    <b>Interpretasi:</b> Nilai dimensi dihitung dari skor perolehan dibagi skor maksimal (jumlah butir × 4) × 100. Semakin tinggi, semakin baik persepsi pada dimensi tersebut.
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-500">Rincian Dimensi Kelompok Ini</h4>
                  <div className="mt-3 space-y-2">
                    {(perDimensi.filter((x: any) => x.kode === selected.kode) ?? []).map((d: any) => {
                      const s = d.kategori ? KAT[d.kategori] : null;
                      return (
                        <div key={d.dimensi} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 leading-tight">{d.dimensi}</div>
                            <div className="text-xs text-slate-500">{d.jumlahButir} butir</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-sm font-black ${tone(d.nilaiAvg)}`}>{d.nilaiAvg != null ? Number(d.nilaiAvg).toFixed(1) : "—"}</div>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${s ? s.chip : "bg-white border-slate-200 text-slate-500"}`}>{d.kategori ?? "—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                Data bersifat agregat dan diperbarui otomatis via SSE setiap ada respons baru. Untuk audit per responden, buka <b>Tabel Rekapitulasi</b>.
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50">Tutup</button>
              {selected.type === "akhir" && (
                <button onClick={() => setActiveTab("dimensi")} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black">Lihat per dimensi</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
