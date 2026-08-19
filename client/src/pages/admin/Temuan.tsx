import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../lib/sse";

export default function TemuanPage() {
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ temuan: "", bukti: "", kategori: "Minor" as const, akarMasalah: "", rekomendasi: "", unit: "" });
  const [err, setErr] = useState("");
  useEffect(() => { apiFetch<any[]>("/periode").then((ps) => { setPeriodeList(ps); const a = ps.find((p) => p.status === "aktif") ?? ps[0]; if (a) setPeriodeId(a.id); }); }, []);
  const load = () => { if (!periodeId) return; apiFetch(`/temuan?periodeId=${periodeId}`).then((v: any) => setList(v as any)).catch(() => {}); };
  useEffect(load, [periodeId]);
  useSSE(periodeId ? `/api/events?periodeId=${periodeId}` : null, () => load());
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try { await apiFetch("/temuan", { method: "POST", body: JSON.stringify({ periodeId, ...form }) }); setForm({ temuan: "", bukti: "", kategori: "Minor", akarMasalah: "", rekomendasi: "", unit: "" }); load(); } catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Temuan & RTL</h2>
        <p className="text-slate-500 text-sm mt-1">Mayor / Minor / Observasi — live via SSE per periode.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"><option value="">Pilih periode</option>{periodeList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>
          <span className="text-xs text-slate-400 self-center">{list.length} temuan</span>
        </div>
        {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mt-4">{err}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Tambah Temuan</div>
          <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Temuan</span><textarea value={form.temuan} onChange={(e) => setForm({ ...form, temuan: e.target.value })} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm" required /></label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Kategori</span><select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as any })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"><option>Mayor</option><option>Minor</option><option>Observasi</option></select></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Unit</span><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Fakultas/Prodi (opsional)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></label>
          </div>
          <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Bukti</span><textarea value={form.bukti} onChange={(e) => setForm({ ...form, bukti: e.target.value })} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Akar Masalah</span><textarea value={form.akarMasalah} onChange={(e) => setForm({ ...form, akarMasalah: e.target.value })} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Rekomendasi</span><textarea value={form.rekomendasi} onChange={(e) => setForm({ ...form, rekomendasi: e.target.value })} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></label>
          <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-md">Simpan Temuan</button>
        </form>
      </div>
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between gap-2"><span className="font-semibold text-sm text-slate-800">{t.temuan}</span><span className={`text-xs px-3 py-1 rounded-full h-fit font-bold border ${t.kategori === "Mayor" ? "bg-rose-50 text-rose-700 border-rose-200" : t.kategori === "Minor" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 border-slate-200 text-slate-600"}`}>{t.kategori}</span></div>
            {t.bukti && <div className="text-xs text-slate-600 mt-2">Bukti: {t.bukti}</div>}
            {t.rekomendasi && <div className="text-xs text-slate-600">Rekomendasi: {t.rekomendasi}</div>}
            <div className="text-xs text-slate-400 mt-2">{t.unit ?? ""} · {new Date(t.createdAt).toLocaleDateString("id-ID")}</div>
            <button onClick={async () => { if (!confirm("Hapus temuan ini?")) return; await apiFetch(`/temuan/${t.id}`, { method: "DELETE" }); load(); }} className="mt-3 text-xs font-bold text-rose-600 hover:underline">Hapus</button>
          </div>
        ))}
        {!list.length && <div className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">Belum ada temuan di periode ini.</div>}
      </div>
    </div>
  );
}
