import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, API } from "../../lib/api";
import { useSSE } from "../../lib/sse";
const KAT_STYLE: Record<string, string> = {
  "Sangat Baik": "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Baik": "bg-blue-50 border-blue-200 text-blue-700",
  "Cukup": "bg-amber-50 border-amber-200 text-amber-700",
  "Kurang": "bg-orange-50 border-orange-200 text-orange-700",
  "Sangat Kurang": "bg-rose-50 border-rose-200 text-rose-700",
};
const KAT_DOT: Record<string, string> = {
  "Sangat Baik": "bg-emerald-500",
  "Baik": "bg-blue-500",
  "Cukup": "bg-amber-500",
  "Kurang": "bg-orange-500",
  "Sangat Kurang": "bg-rose-500",
};
function tone(n: number | null | undefined) {
  if (n == null) return "text-slate-400";
  if (n >= 86) return "text-emerald-600";
  if (n >= 76) return "text-blue-600";
  if (n >= 66) return "text-amber-600";
  if (n >= 51) return "text-orange-600";
  return "text-rose-600";
}
function barTone(n: number | null | undefined) {
  if (n == null) return "bg-slate-300";
  if (n >= 86) return "bg-emerald-500";
  if (n >= 76) return "bg-blue-500";
  if (n >= 66) return "bg-amber-500";
  if (n >= 51) return "bg-orange-500";
  return "bg-rose-500";
}
const TEMPLATE_LABEL: Record<string, string> = {
  UNIV: "Universitas", FAK: "Fakultas", ASESOR: "Asesor", LPM: "LPM", SEK: "Sekretariat", MHS: "Mahasiswa",
};
export default function ResponsPage() {
  const [periodeId, setPeriodeId] = useState("");
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const qRef = useRef(q);
  qRef.current = q;
  useEffect(() => {
    apiFetch<any[]>("/periode").then((ps) => {
      setPeriodeList(ps);
      const a = (ps as any).find((p: any) => p.status === "aktif") ?? ps[0];
      if (a) setPeriodeId(a.id);
    });
  }, []);
  const load = (opts?: { qOverride?: string; pageOverride?: number }) => {
    const qVal = opts?.qOverride !== undefined ? opts.qOverride : qRef.current;
    const pageVal = opts?.pageOverride ?? page;
    const qs = new URLSearchParams();
    if (periodeId) qs.set("periodeId", periodeId);
    if (qVal.trim()) qs.set("q", qVal.trim());
    qs.set("page", String(pageVal));
    qs.set("pageSize", String(pageSize));
    setLoading(true);
    apiFetch(`/respons?${qs.toString()}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { if (!periodeId && !periodeList.length) return; load(); }, [periodeId, page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load({ qOverride: q, pageOverride: 1 }); }, 380);
    return () => clearTimeout(t);
  }, [q]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());
  const open = async (id: string) => { const r = await apiFetch(`/respons/${id}`); setDetail(r); };
  const anulir = async (id: string) => {
    const alasan = prompt("Alasan anulir (wajib diisi):");
    if (!alasan || !alasan.trim()) return;
    await apiFetch(`/respons/${id}/anulir`, { method: "POST", body: JSON.stringify({ alasan: alasan.trim() }) });
    setDetail(null); load();
  };
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const rows: any[] = data?.data ?? [];
  const detailDimensiGroups = useMemo(() => {
    if (!detail?.jawabanSkala?.length) return [];
    const map = new Map<string, { dimensi: string; items: any[]; sum: number }>();
    for (const j of detail.jawabanSkala) {
      const dim = j.butir?.dimensi ?? "Lainnya";
      if (!map.has(dim)) map.set(dim, { dimensi: dim, items: [], sum: 0 });
      const g = map.get(dim)!; g.items.push(j); g.sum += j.skor;
    }
    return Array.from(map.values()).map((g) => {
      const n = g.items.length; const max = n * 4; const pct = max ? (g.sum / max) * 100 : 0;
      return { ...g, count: n, max, pct, nilai: pct };
    });
  }, [detail]);
  const selectedPeriode = periodeList.find((p) => p.id === periodeId);
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30" />
        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700">Rekapitulasi</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold normal-case tracking-normal">{total} entri</span>
              {selectedPeriode && <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 normal-case tracking-normal font-semibold"><i className="fa-regular fa-calendar text-slate-400" /> {selectedPeriode.nama}</span>}
            </div>
            <h1 className="mt-2 text-[22px] sm:text-[26px] font-black tracking-tight text-slate-900 leading-tight">Tabel Rekapitulasi Responden</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">Jejak lengkap pengisian instrumen — ketik untuk menyaring langsung, buka detail jawaban tiap responden.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm"><i className="fa-solid fa-database" /> {total} data</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600"><i className="fa-solid fa-bolt text-amber-500" /> Live SSE</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">Halaman {page} / {totalPages}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select value={periodeId} onChange={(e) => { setPeriodeId(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 min-w-[190px]">
              <option value="">Semua periode</option>
              {periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            {periodeId ? <a href={API(`/exports/respons/excel?periodeId=${periodeId}`)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"><i className="fa-solid fa-file-excel" /> Export Excel</a> : <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold">Pilih periode untuk export</span>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none"><i className="fa-solid fa-magnifying-glass text-sm" /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ketik untuk mencari — nama, unit, jabatan… (pencarian live)" className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-200 text-sm font-medium placeholder:text-slate-400 transition" />
            {q ? <button onClick={() => setQ("")} className="absolute inset-y-0 right-0 pr-3 flex items-center"><span className="w-8 h-8 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm"><i className="fa-solid fa-xmark text-xs" /></span></button> : <span className="absolute inset-y-0 right-0 pr-4 hidden sm:flex items-center text-[11px] font-bold tracking-widest uppercase text-slate-400">Live</span>}
          </div>
          {q && <p className="mt-2 text-xs text-slate-500">Mencari <b className="text-slate-800">“{q}”</b> — hasil diperbarui otomatis.</p>}
        </div>
        <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-700"><span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} /> {loading ? "Memuat…" : "Siap"}</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600">Menampilkan <b className="text-slate-900">{rows.length}</b> dari <b className="text-slate-900">{total}</b> respons</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Kategori:</span>
            {["Sangat Baik", "Baik", "Cukup", "Kurang", "Sangat Kurang"].map((k) => <span key={k} className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600"><span className={`w-2 h-2 rounded-full ${KAT_DOT[k]}`} /> {k}</span>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100"><th className="py-4 px-6 whitespace-nowrap"><span className="inline-flex items-center gap-2"><i className="fa-regular fa-user text-slate-400" /> Responden</span></th><th className="py-4 px-6 whitespace-nowrap">Kelas / Unit</th><th className="py-4 px-6 whitespace-nowrap">Instrumen</th><th className="py-4 px-6 whitespace-nowrap">Skor</th><th className="py-4 px-6 whitespace-nowrap">Waktu</th><th className="py-4 px-6 text-right whitespace-nowrap">Aksi</th></tr></thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {rows.map((r: any) => {
                const nama = String((r.identitas as any)?.nama ?? "—");
                const unit = (r.identitas as any)?.unit ?? (r.identitas as any)?.jabatan ?? "—";
                const kategori = r.kategori ?? "—";
                const katCls = KAT_STYLE[kategori] ?? "bg-white border-slate-200 text-slate-600";
                const nilai = r.nilaiAkhir != null ? Math.round(r.nilaiAkhir) : null;
                const isAnulir = r.status === "anulir";
                return (
                  <tr key={r.id} className={`group hover:bg-slate-50/80 transition ${isAnulir ? "opacity-60" : ""}`}>
                    <td className="py-4 px-6"><div className="flex items-center gap-3 min-w-[180px]"><span className={`w-9 h-9 rounded-xl grid place-items-center font-black text-xs shadow-sm shrink-0 ${isAnulir ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-indigo-600 text-white shadow-indigo-200"}`}>{nama.charAt(0).toUpperCase()}</span><div className="min-w-0"><div className="font-bold text-slate-900 leading-tight flex items-center gap-2"><span className="truncate">{nama}</span>{isAnulir && <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase">Anulir</span>}</div><div className="text-xs text-slate-500 truncate">{(r.identitas as any)?.jabatan ?? "—"} {(r.identitas as any)?.prodi ? `· ${(r.identitas as any).prodi}` : ""}</div></div></div></td>
                    <td className="py-4 px-6"><span className="inline-flex max-w-[180px] truncate px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">{unit}</span></td>
                    <td className="py-4 px-6"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-white border border-slate-200 grid place-items-center text-[11px] font-black text-slate-700">{r.templateKode.slice(0, 3)}</span><div><div className="text-xs font-bold text-slate-800 leading-none">{TEMPLATE_LABEL[r.templateKode] ?? r.templateKode}</div><div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{r.templateKode}</div></div></div></td>
                    <td className="py-4 px-6"><div className="min-w-[160px]"><div className="flex items-center gap-2"><span className={`text-sm font-black ${isAnulir ? "text-slate-400" : tone(nilai)}`}>{nilai != null ? `${nilai}` : "—"} <span className="text-xs font-semibold text-slate-400">/ 100</span></span><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${isAnulir ? "bg-slate-100 border-slate-200 text-slate-500" : katCls}`}><span className={`w-1.5 h-1.5 rounded-full ${KAT_DOT[kategori] ?? "bg-slate-400"}`} /> {kategori}</span></div><div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isAnulir ? "bg-slate-300" : barTone(nilai)}`} style={{ width: `${nilai != null ? Math.min(100, Math.max(4, nilai)) : 0}%` }} /></div></div></td>
                    <td className="py-4 px-6 whitespace-nowrap"><div className="text-xs font-semibold text-slate-700">{new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div><div className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div></td>
                    <td className="py-4 px-6"><div className="flex justify-end gap-1.5"><button onClick={() => open(r.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-sm"><i className="fa-regular fa-eye" /> Lihat</button>{r.status !== "anulir" && <button onClick={() => anulir(r.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold">Anulir</button>}</div></td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={6} className="py-16 text-center"><div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto text-slate-400"><i className="fa-regular fa-inbox text-xl" /></div><p className="mt-3 text-sm font-semibold text-slate-600">Belum ada data respons</p><p className="text-xs text-slate-400">Coba ubah kata kunci atau pilih periode lain.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Total <b className="text-slate-800">{total}</b> entri • Halaman <b className="text-slate-800">{page}</b> dari <b className="text-slate-800">{totalPages}</b></div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1.5"><i className="fa-solid fa-chevron-left text-[10px]" /> Sebelumnya</button>
            <span className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black min-w-[44px] text-center">{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1.5">Berikutnya <i className="fa-solid fa-chevron-right text-[10px]" /></button>
          </div>
        </div>
      </div>
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <div className="relative bg-white w-full sm:max-w-[820px] max-h-[100dvh] sm:max-h-[88vh] rounded-t-[1.75rem] sm:rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="shrink-0 relative border-b border-slate-200 bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 pointer-events-none" />
              <div className="absolute -right-10 -top-10 w-56 h-56 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
              <div className="relative p-5 sm:p-6 flex items-start gap-4">
                <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white grid place-items-center font-black shadow-md shrink-0 text-sm">{String((detail.identitas as any)?.nama ?? "?").charAt(0).toUpperCase()}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-black text-slate-900 leading-tight break-words">{(detail.identitas as any)?.nama ?? "—"}</h3>
                  <p className="text-[13px] text-slate-600 mt-1 leading-snug break-words">{(detail.identitas as any)?.jabatan ?? "—"} <span className="text-slate-300">•</span> {(detail.identitas as any)?.unit ?? "—"}{(detail.identitas as any)?.fakultas ? ` • ${(detail.identitas as any).fakultas}` : ""} {(detail.identitas as any)?.prodi ? ` · ${(detail.identitas as any).prodi}` : ""}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm"><span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center text-[10px] font-black">{detail.templateKode.slice(0, 3)}</span>{TEMPLATE_LABEL[detail.templateKode] ?? detail.templateKode} <span className="text-slate-400">· {detail.templateKode}</span></span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${KAT_STYLE[detail.kategori] ?? "bg-white border-slate-200 text-slate-600"}`}><span className={`w-2 h-2 rounded-full ${KAT_DOT[detail.kategori] ?? "bg-slate-400"}`} /> {detail.kategori ?? "—"}</span>
                    {detail.status === "anulir" && <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold">Anulir</span>}
                  </div>
                </div>
                <button onClick={() => setDetail(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm shrink-0"><i className="fa-solid fa-xmark" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto overscroll-contain">
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 h-fit lg:sticky lg:top-0">
                  <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Nilai Akhir</div>
                  <div className={`mt-1 text-3xl font-black ${tone(detail.nilaiAkhir != null ? Math.round(detail.nilaiAkhir) : null)}`}>{detail.nilaiAkhir != null ? Math.round(detail.nilaiAkhir * 100) / 100 : "—"} <span className="text-sm font-semibold text-slate-400">/ 100</span></div>
                  <div className="mt-3 h-2 bg-white border border-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barTone(detail.nilaiAkhir != null ? Math.round(detail.nilaiAkhir) : null)}`} style={{ width: `${detail.nilaiAkhir != null ? Math.min(100, Math.round(detail.nilaiAkhir)) : 0}%` }} /></div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Kategori</span><b className="text-slate-800 text-right">{detail.kategori ?? "—"}</b></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Tindak lanjut</span><b className="text-slate-800 text-right max-w-[160px] leading-snug">{detail.tindakLanjut ?? "—"}</b></div>
                    <div className="flex justify-between gap-3 items-center"><span className="text-slate-500">Status</span><span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${detail.status === "anulir" ? "bg-slate-900 text-white border-slate-900" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{detail.status}</span></div>
                  </div>
                  {detail.status !== "anulir" && <button onClick={() => anulir(detail.id)} className="mt-4 w-full px-3 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2"><i className="fa-solid fa-ban" /> Anulir respons ini</button>}
                  {detail.status === "anulir" && detail.alasanAnulir && <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3 text-xs"><div className="font-bold text-slate-700">Alasan anulir</div><div className="text-slate-600 mt-1 leading-relaxed break-words">{detail.alasanAnulir}</div></div>}
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-xs font-black tracking-widest uppercase text-slate-500">Identitas Responden</h4>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Nama</div><div className="font-bold text-slate-900 break-words">{(detail.identitas as any)?.nama ?? "—"}</div></div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Jabatan</div><div className="font-semibold text-slate-800 break-words">{(detail.identitas as any)?.jabatan ?? "—"}</div></div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Unit / Kelas</div><div className="font-semibold text-slate-800 break-words">{(detail.identitas as any)?.unit ?? "—"}</div></div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Fakultas / Prodi</div><div className="font-semibold text-slate-800 break-words">{(detail.identitas as any)?.fakultas ?? "—"} {(detail.identitas as any)?.prodi ? `· ${(detail.identitas as any).prodi}` : ""}</div></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-600"><i className="fa-regular fa-clock text-slate-400" /> {new Date(detail.createdAt).toLocaleString("id-ID")}</span>{detail.ip && <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 font-mono text-[11px] text-slate-600">IP {detail.ip}</span>}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-xs font-black tracking-widest uppercase text-slate-500">Rincian per Dimensi</h4>
                    <div className="mt-3 space-y-3">
                      {detailDimensiGroups.length ? detailDimensiGroups.map((g) => (
                        <div key={g.dimensi} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                          <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-800">{g.dimensi}</span><span className={`text-xs font-black ${tone(Math.round(g.nilai))}`}>{g.nilai.toFixed(1)} <span className="font-semibold text-slate-400">/ 100</span></span></div>
                          <div className="mt-2 h-1.5 bg-white border border-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barTone(Math.round(g.nilai))}`} style={{ width: `${Math.min(100, g.nilai)}%` }} /></div>
                          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-slate-500"><span>{g.count} butir • skor {g.sum}/{g.max}</span><span>{g.items.filter((x: any) => x.skor >= 3).length} jawaban ≥ 3</span></div>
                        </div>
                      )) : <div className="text-xs text-slate-400">Tidak ada rincian dimensi.</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 sm:px-6 pb-2">
                <h4 className="text-xs font-black tracking-widest uppercase text-slate-500 flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center"><i className="fa-solid fa-list-ol text-[11px]" /></span>Jawaban Skala ({detail.jawabanSkala?.length ?? 0} butir)</h4>
                <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-white"><div className="max-h-[300px] overflow-auto divide-y divide-slate-100">
                  {(detail.jawabanSkala ?? []).map((j: any) => {
                    const s = j.skor as number; const dot = s >= 4 ? "bg-emerald-500" : s === 3 ? "bg-blue-500" : s === 2 ? "bg-amber-500" : "bg-rose-500";
                    return (<div key={j.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50/60"><span className={`mt-1 w-2 h-2 rounded-full ${dot} shrink-0`} /><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-500">#{j.butir?.nomor ?? "—"} • {j.butir?.dimensi ?? "—"}</div><div className="text-sm text-slate-800 leading-relaxed break-words">{j.butir?.teks ?? j.butirId.slice(0, 12)}</div></div><span className={`shrink-0 h-fit px-2.5 py-1 rounded-full border text-xs font-black ${s >= 4 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : s === 3 ? "bg-blue-50 border-blue-200 text-blue-700" : s === 2 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>{s} / 4</span></div>);
                  })}
                  {!(detail.jawabanSkala ?? []).length && <div className="p-6 text-center text-sm text-slate-400">Tidak ada jawaban skala.</div>}
                </div></div>
              </div>
              <div className="p-5 sm:p-6 pt-4">
                <h4 className="text-xs font-black tracking-widest uppercase text-slate-500 flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-violet-600 text-white grid place-items-center"><i className="fa-regular fa-message text-[11px]" /></span>Jawaban Terbuka</h4>
                {detail.jawabanTerbuka ? <div className="mt-3 grid grid-cols-1 gap-3">{[
                  { k: "q21", label: "Q21 — Hal yang paling membantu" },
                  { k: "q22", label: "Q22 — Kendala yang dialami" },
                  { k: "q23", label: "Q23 — Saran perbaikan" },
                  { k: "q24", label: "Q24 — Harapan ke depan" },
                  { k: "q25", label: "Q25 — Komentar tambahan" },
                ].map((f) => {
                  const v = (detail.jawabanTerbuka as any)?.[f.k]; const has = v && String(v).trim();
                  return (<div key={f.k} className={`rounded-2xl border p-4 ${has ? "bg-violet-50/40 border-violet-200" : "bg-slate-50 border-slate-200"}`}><div className="text-xs font-bold text-slate-600">{f.label}</div><div className={`mt-1 text-sm leading-relaxed break-words ${has ? "text-slate-800" : "text-slate-400 italic"}`}>{has ? String(v) : "Tidak diisi"}</div></div>);
                })}</div> : <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">Tidak ada jawaban terbuka.</div>}
              </div>
            </div>
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
              <button onClick={() => setDetail(null)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50">Tutup</button>
              <button onClick={() => { if (detail) open(detail.id); }} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black flex items-center gap-2"><i className="fa-solid fa-rotate" /> Muat ulang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
