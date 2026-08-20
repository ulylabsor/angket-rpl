import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, API } from "../../lib/api";
import { useSSE } from "../../lib/sse";

const KAT_STYLE: Record<string, string> = {
  "Sangat Baik": "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Baik": "bg-blue-50 border-blue-200 text-blue-700",
  "Cukup": "bg-amber-50 border-amber-200 text-amber-700",
  "Kurang": "bg-orange-50 border-orange-200 text-orange-700",
  "Sangat Kurang": "bg-rose-50 border-rose-200 text-rose-700",
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
const TEMPLATE_LABEL: Record<string, string> = { UNIV: "Universitas", FAK: "Fakultas", ASESOR: "Asesor", LPM: "LPM", SEK: "Sekretariat", MHS: "Mahasiswa" };

export default function ResponsPage() {
  const [periodeId, setPeriodeId] = useState("");
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const qRef = useRef(q); qRef.current = q;

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
    qs.set("page", String(pageVal)); qs.set("pageSize", String(pageSize));
    setLoading(true);
    apiFetch(`/respons?${qs.toString()}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { if (!periodeId && !periodeList.length) return; load(); }, [periodeId, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load({ qOverride: q, pageOverride: 1 }); }, 380); return () => clearTimeout(t); }, [q]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());
  const open = async (id: string) => { const r = await apiFetch(`/respons/${id}`); setDetail(r); };
  const anulir = async (id: string) => {
    const alasan = prompt("Alasan anulir (wajib diisi):"); if (!alasan || !alasan.trim()) return;
    await apiFetch(`/respons/${id}/anulir`, { method: "POST", body: JSON.stringify({ alasan: alasan.trim() }) });
    setDetail(null); load();
  };
  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try { await apiFetch(`/respons/${confirmDelete.id}`, { method: "DELETE" }); setConfirmDelete(null); if (detail?.id === confirmDelete.id) setDetail(null); load(); }
    catch (e: any) { alert(e?.message ?? String(e)); } finally { setDeleting(false); }
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Data Responden</h2>
        <p className="text-slate-500 mt-1 text-sm">Daftar lengkap hasil survei yang telah dikirimkan. Live via SSE.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, unit, jabatan…" className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
          {q && <button onClick={() => setQ("")} className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-slate-600">✕</button>}
        </div>
        <div className="flex gap-2">
          <select value={periodeId} onChange={(e) => { setPeriodeId(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-sm min-w-[180px] focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua periode</option>
            {periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          {periodeId ? <a href={API(`/exports/respons/excel?periodeId=${periodeId}`)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md">Export Excel</a> : <span className="px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm font-bold">Pilih periode</span>}
        </div>
      </div>

      {/* Table — SurveyFlow Responses 1:1: sticky ID/date + colored pills */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 min-w-[900px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">ID Responden / Waktu</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nama / Unit</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Instrumen</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Skor</th>
                <th className="px-6 py-4 font-semibold text-center sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">Skor Akhir</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!rows.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">{loading ? "Memuat…" : "Belum ada responden."}</td></tr>
              ) : rows.map((r: any) => {
                const nama = String((r.identitas as any)?.nama ?? "—");
                const unit = (r.identitas as any)?.unit ?? (r.identitas as any)?.jabatan ?? "—";
                const kategori = r.kategori ?? "—";
                const nilai = r.nilaiAkhir != null ? Math.round(r.nilaiAkhir) : null;
                const isAnulir = r.status === "anulir";
                const pillTone = KAT_STYLE[kategori] ?? "bg-slate-50 border-slate-200 text-slate-600";
                return (
                  <tr key={r.id} className={`hover:bg-slate-50/80 group ${isAnulir ? "opacity-60" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="font-bold text-slate-900">#RES-{String(r.id).slice(-5).toUpperCase()}</div>
                      <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">{nama} {isAnulir && <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px]">Anulir</span>}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">{unit}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center text-[11px] font-black">{r.templateKode.slice(0, 3)}</span> {TEMPLATE_LABEL[r.templateKode] ?? r.templateKode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${isAnulir ? "bg-slate-100 border-slate-200 text-slate-500" : pillTone}`}>{kategori}</span>
                      <div className={`text-xs font-bold mt-1 ${tone(nilai)}`}>{nilai != null ? `${nilai}/100` : "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <span className="font-extrabold text-slate-800 text-base bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{nilai != null ? nilai : "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => open(r.id)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-sm">Lihat</button>
                      {r.status !== "anulir" && <button onClick={() => anulir(r.id)} className="ml-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-200 hover:text-amber-700 hover:bg-amber-50 text-xs font-bold">Anulir</button>}
                      <button onClick={() => setConfirmDelete({ id: r.id, nama })} className="ml-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm">Hapus</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Total <b className="text-slate-800">{total}</b> • Halaman <b className="text-slate-800">{page}</b> / <b className="text-slate-800">{totalPages}</b></div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 hover:bg-slate-50">Sebelumnya</button>
            <span className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black min-w-[44px] text-center">{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 hover:bg-slate-50">Berikutnya</button>
          </div>
        </div>
      </div>

      {detail && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <div className="relative bg-white w-full max-w-[820px] max-h-[88vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{(detail.identitas as any)?.nama ?? "—"}</h3>
                <p className="text-sm text-slate-500">{(detail.identitas as any)?.jabatan ?? "—"} • {(detail.identitas as any)?.unit ?? "—"}{detail.templateKode === "MHS" && (detail.identitas as any)?.kewarganegaraan ? ` • ${String((detail.identitas as any).kewarganegaraan).toUpperCase().includes("ASING") || String((detail.identitas as any).kewarganegaraan).toUpperCase() === "WNA" ? "Warga Negara Asing" : "Warga Negara Indonesia"}${String((detail.identitas as any).negara ?? (detail.identitas as any).asalNegara ?? (detail.identitas as any).negaraAsal ?? "").trim() ? ` — ${String((detail.identitas as any).negara ?? (detail.identitas as any).asalNegara ?? (detail.identitas as any).negaraAsal ?? "").trim()}` : ""}` : ""} {(detail.identitas as any)?.fakultas ? `• ${(detail.identitas as any).fakultas}` : ""} {(detail.identitas as any)?.prodi ? ` / ${(detail.identitas as any).prodi}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold">{detail.templateKode}</span>
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold ${KAT_STYLE[detail.kategori] ?? "bg-white border-slate-200"}`}>{detail.kategori ?? "—"}</span>
                  {detail.status === "anulir" && <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">Anulir</span>}
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-600 hover:bg-slate-50">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Akhir</div>
                <div className={`text-2xl font-black ${tone(detail.nilaiAkhir)}`}>{detail.nilaiAkhir != null ? Math.round(detail.nilaiAkhir) : "—"} <span className="text-sm font-semibold text-slate-400">/ 100</span></div>
                <div className="mt-2 h-2 bg-white border border-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barTone(detail.nilaiAkhir)}`} style={{ width: `${detail.nilaiAkhir != null ? Math.min(100, Math.round(detail.nilaiAkhir)) : 0}%` }} /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rincian per Dimensi</h4>
                <div className="mt-3 space-y-2">
                  {detailDimensiGroups.length ? detailDimensiGroups.map((g) => (
                    <div key={g.dimensi} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">{g.dimensi}</span>
                      <span className={`text-sm font-black ${tone(Math.round(g.nilai))}`}>{g.nilai.toFixed(1)}/100</span>
                    </div>
                  )) : <p className="text-xs text-slate-400">Tidak ada rincian.</p>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Jawaban Skala</h4>
                <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-[260px] overflow-auto">
                  {(detail.jawabanSkala ?? []).map((j: any) => (
                    <div key={j.id} className="px-4 py-3 flex gap-3">
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${j.skor >= 4 ? "bg-emerald-500" : j.skor === 3 ? "bg-blue-500" : j.skor === 2 ? "bg-amber-500" : "bg-rose-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-500">#{j.butir?.nomor ?? "—"} • {j.butir?.dimensi ?? "—"}</div>
                        <div className="text-sm text-slate-800">{j.butir?.teks ?? j.butirId.slice(0, 12)}</div>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full border text-xs font-black bg-white border-slate-200">{j.skor}/4</span>
                    </div>
                  ))}
                </div>
              </div>
              {detail.jawabanTerbuka && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Jawaban Terbuka</h4>
                  <div className="grid gap-2">
                    {[
                      { k: "q21", label: "Q21" }, { k: "q22", label: "Q22" }, { k: "q23", label: "Q23" }, { k: "q24", label: "Q24" }, { k: "q25", label: "Q25" },
                    ].map((f) => {
                      const v = (detail.jawabanTerbuka as any)?.[f.k];
                      return <div key={f.k} className="rounded-xl border border-slate-200 p-3 bg-slate-50"><div className="text-xs font-bold text-slate-600">{f.label}</div><div className={`text-sm ${v ? "text-slate-800" : "text-slate-400 italic"}`}>{v || "Tidak diisi"}</div></div>;
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
              <button onClick={() => setDetail(null)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold">Tutup</button>
              {detail.status !== "anulir" && <button onClick={() => anulir(detail.id)} className="px-5 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 text-sm font-bold">Anulir</button>}
              <button onClick={() => setConfirmDelete({ id: detail.id, nama: String((detail.identitas as any)?.nama ?? "—") })} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">Hapus</button>
            </div>
          </div>
        </div>, document.body)}

      {/* Konfirmasi hapus — portal agar tidak terpotong tabel */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 grid place-items-center"><span className="text-xl">⚠</span></div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Hapus data penilaian?</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Data responden <b className="text-slate-900">{confirmDelete.nama}</b> akan dihapus permanen beserta jawaban skala &amp; terbuka. Tidak dapat dikembalikan. Lanjutkan?
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button disabled={deleting} onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold disabled:opacity-50">Batal</button>
              <button disabled={deleting} onClick={doDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50">{deleting ? "Menghapus…" : "Ya, hapus"}</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
