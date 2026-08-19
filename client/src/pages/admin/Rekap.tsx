import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList } from "lucide-react";
import { apiFetch, API } from "../../lib/api";
import { useSSE } from "../../lib/sse";

const KAT: Record<string, { chip: string; dot: string; bar: string }> = {
  "Sangat Baik": { chip: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  "Baik": { chip: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500", bar: "bg-blue-500" },
  "Cukup": { chip: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", bar: "bg-amber-500" },
  "Kurang": { chip: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500" },
  "Sangat Kurang": { chip: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500", bar: "bg-rose-500" },
};
function katOf(v: number | null | undefined) { if (v == null) return null; if (v >= 86) return "Sangat Baik"; if (v >= 76) return "Baik"; if (v >= 66) return "Cukup"; if (v >= 51) return "Kurang"; return "Sangat Kurang"; }
function tone(n: number | null | undefined) { if (n == null) return "text-slate-400"; if (n >= 86) return "text-emerald-600"; if (n >= 76) return "text-blue-600"; if (n >= 66) return "text-amber-600"; if (n >= 51) return "text-orange-600"; return "text-rose-600"; }
const LABEL: Record<string, { title: string; short: string }> = { UNIV: { title: "Pengelola Universitas", short: "UNIV" }, FAK: { title: "Fakultas / Pascasarjana", short: "FAK" }, ASESOR: { title: "Asesor", short: "ASESOR" }, SEK: { title: "Sekretariat", short: "SEK" }, LPM: { title: "LPM", short: "LPM" }, MHS: { title: "Mahasiswa / Pemohon", short: "MHS" } };
const ORDER = ["UNIV", "FAK", "ASESOR", "SEK", "LPM", "MHS"] as const;

export default function RekapPage() {
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dimensi" | "akhir">("dimensi");

  useEffect(() => {
    apiFetch<any[]>("/periode").then((ps) => { setPeriodeList(ps); const a = (ps as any).find((p: any) => p.status === "aktif") ?? ps[0]; if (a) setPeriodeId(a.id); });
  }, []);
  const load = () => { if (!periodeId) return; apiFetch(`/rekap?periodeId=${periodeId}`).then(setData).catch(() => {}); };
  useEffect(load, [periodeId]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());
  const perDimensi: any[] = data?.perDimensi ?? [];
  const perKelompok: any[] = data?.perKelompok ?? [];
  const ringkasan = data?.ringkasan;
  const groupedDimensi = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const r of perDimensi) { const k = r.kode as string; if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
    return ORDER.map((kode) => ({ kode, label: LABEL[kode]?.title ?? kode, rows: m.get(kode) ?? [] })).filter((g) => g.rows.length);
  }, [perDimensi]);
  void (ringkasan?.totalRespons ?? perKelompok.reduce((a: number, r: any) => a + (r.jumlahRespons ?? 0), 0));
  const rataAll = ringkasan?.rataRataSemua as number | null | undefined;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rekap per Dimensi</h2>
          <p className="text-slate-500 mt-1 text-sm">Mutu per dimensi dan nilai akhir tiap kelompok. Live via SSE.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 min-w-[180px]">
            <option value="">Pilih periode</option>{periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          {periodeId ? <a href={API(`/exports/rekap/excel?periodeId=${periodeId}`)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md">Export Excel</a> : <span className="px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm font-bold">Pilih periode</span>}
        </div>
      </div>

      {!data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center mx-auto text-indigo-600"><ClipboardList size={20} /></div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Pilih periode untuk melihat rekap</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ringkasan Mutu Keseluruhan</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${tone(rataAll)}`}>{rataAll != null ? rataAll.toFixed(1) : "—"}</span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
                {katOf(rataAll ?? null) && <span className={`ml-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${KAT[katOf(rataAll!)!].chip}`}><span className={`w-2 h-2 rounded-full ${KAT[katOf(rataAll!)!].dot}`} /> {katOf(rataAll!)}</span>}
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden max-w-md"><div className={`h-full rounded-full ${rataAll != null && rataAll >= 76 ? "bg-emerald-500" : rataAll != null && rataAll >= 66 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${rataAll != null ? Math.min(100, rataAll) : 0}%` }} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Legenda Kategori</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(KAT).map(([label, s]) => <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${s.chip}`}><span className={`w-2 h-2 rounded-full ${s.dot}`} /> {label}</span>)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full w-fit border border-slate-200">
            <button onClick={() => setActiveTab("dimensi")} className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === "dimensi" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}>Per Dimensi</button>
            <button onClick={() => setActiveTab("akhir")} className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === "akhir" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}>Nilai Akhir</button>
          </div>

          {activeTab === "dimensi" ? (
            <div className="space-y-4">
              {groupedDimensi.length ? groupedDimensi.map((group) => (
                <div key={group.kode} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-black">{group.kode.slice(0, 4)}</span>
                      <div><div className="text-sm font-bold text-slate-900">{group.label}</div><div className="text-xs text-slate-500">{group.rows.length} dimensi</div></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{group.rows[0]?.jumlahRespons ?? 0} responden</span>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.rows.map((r: any) => {
                      const kat = r.kategori as string | null; const s = kat ? KAT[kat] : null; const nilai = r.nilaiAvg as number | null;
                      return (
                        <div key={`${r.kode}-${r.dimensi}`} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{r.kode} · {r.jumlahButir} butir</div><div className="text-[15px] font-bold text-slate-900 mt-1">{r.dimensi}</div><div className="text-xs text-slate-500 mt-1">{r.responden}</div></div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${s ? s.chip : "bg-white border-slate-200 text-slate-500"}`}>{kat ?? "—"}</span>
                          </div>
                          <div className="mt-4 flex items-baseline gap-2"><span className={`text-2xl font-black ${tone(nilai)}`}>{nilai != null ? nilai.toFixed(1) : "—"}</span><span className="text-xs font-semibold text-slate-400">/ 100</span><span className="ml-auto text-xs text-slate-500">n={r.jumlahRespons}</span></div>
                          <div className="mt-2 h-2 bg-white border border-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${s ? s.bar : "bg-slate-300"}`} style={{ width: `${nilai != null ? Math.min(100, nilai) : 0}%` }} /></div>
                          <button onClick={() => setSelected({ ...r, type: "dimensi" })} className="mt-3 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black">Detail</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">Belum ada rekap dimensi.</div>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {perKelompok.map((r: any) => {
                const kat = r.kategori as string | null; const s = kat ? KAT[kat] : null; const nilai = r.nilaiAkhirAvg as number | null;
                return (
                  <div key={r.kode} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-xl bg-indigo-600 text-white grid place-items-center font-black shrink-0">{r.kode.slice(0, 3)}</span>
                        <div className="min-w-0"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{r.kode}</div><div className="text-[15px] font-bold text-slate-900">{r.responden}</div><div className="text-xs text-slate-500">{r.jumlahRespons} respons</div></div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${s ? s.chip : "bg-slate-50 border-slate-200 text-slate-500"}`}>{kat ?? "—"}</span>
                    </div>
                    <div className="mt-5 flex items-baseline gap-2"><span className={`text-3xl font-black ${tone(nilai)}`}>{nilai != null ? nilai.toFixed(1) : "—"}</span><span className="text-sm font-semibold text-slate-400">/ 100</span></div>
                    <div className="mt-2 h-2.5 bg-slate-100 rounded-full overflow-hidden p-1"><div className={`h-full rounded-full ${s ? s.bar : "bg-slate-300"}`} style={{ width: `${nilai != null ? Math.min(100, nilai) : 0}%` }} /></div>
                    <button onClick={() => setSelected({ ...r, type: "akhir" })} className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black">Lihat rincian</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-[640px] max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{selected.kode} • {selected.responden}</div><h3 className="text-base font-bold text-slate-900">{selected.type === "dimensi" ? selected.dimensi : "Nilai Akhir"}</h3></div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{selected.type === "dimensi" ? "Nilai Dimensi" : "Nilai Akhir"}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${tone(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg)}`}>{(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg) != null ? Number(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg).toFixed(1) : "—"}</span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="mt-3 h-2 bg-white border border-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${selected.kategori && KAT[selected.kategori] ? KAT[selected.kategori].bar : "bg-slate-300"}`} style={{ width: `${(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg) != null ? Math.min(100, Number(selected.type === "dimensi" ? selected.nilaiAvg : selected.nilaiAkhirAvg)) : 0}%` }} /></div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">Data agregat diperbarui via SSE. Untuk audit per responden, buka Data Responden.</div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end"><button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold">Tutup</button></div>
          </div>
        </div>, document.body)}
    </div>
  );
}
