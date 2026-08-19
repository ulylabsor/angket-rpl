import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../lib/sse";

type Periode = { id: string; nama: string; tahun: number; tglMulai: string; tglSelesai: string; status: string; deskripsi?: string | null };
function toDateInput(v: string) { if (!v) return ""; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const d = new Date(v); if (Number.isNaN(d.getTime())) return v.slice(0, 10); return d.toISOString().slice(0, 10); }
const EMPTY = { nama: "", tahun: 2026, tglMulai: "2026-08-01", tglSelesai: "2026-12-31", status: "aktif", deskripsi: "" };

export default function PeriodePage() {
  const [list, setList] = useState<Periode[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => apiFetch<Periode[]>("/periode").then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  useSSE("/api/events", () => load());
  const startEdit = (p: Periode) => {
    setEditingId(p.id);
    setForm({ nama: p.nama, tahun: p.tahun, tglMulai: toDateInput(p.tglMulai), tglSelesai: toDateInput(p.tglSelesai), status: p.status, deskripsi: p.deskripsi ?? "" });
    setErr(""); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY }); setErr(""); setMsg(""); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      if (editingId) { await apiFetch(`/periode/${editingId}`, { method: "PUT", body: JSON.stringify(form) }); setMsg("Periode diperbarui."); cancelEdit(); }
      else { await apiFetch("/periode", { method: "POST", body: JSON.stringify(form) }); setForm({ ...EMPTY, tahun: form.tahun, tglMulai: form.tglMulai, tglSelesai: form.tglSelesai, status: form.status }); setMsg("Periode ditambahkan."); }
      load();
    } catch (e: any) { setErr(e.message); }
  };
  const del = async (id: string) => {
    if (!confirm("Hapus periode? Hanya bisa jika belum ada respons.")) return;
    try { await apiFetch(`/periode/${id}`, { method: "DELETE" }); setMsg("Periode dihapus."); load(); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{editingId ? "Ubah Periode" : "Kelola Periode"}</h2>
        <p className="text-slate-500 text-sm mt-1">Multi periode aktif didukung. Link publik: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/angket/:kode?periodeId=ID</code></p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{err}</div>}
        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">{msg}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Nama Periode</span><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Monev RPL 2026 Ganjil" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" required /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Tahun</span><input type="number" value={form.tahun} onChange={(e) => setForm({ ...form, tahun: parseInt(e.target.value) || 2026 })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Mulai</span><input type="date" value={form.tglMulai} onChange={(e) => setForm({ ...form, tglMulai: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Selesai</span><input type="date" value={form.tglSelesai} onChange={(e) => setForm({ ...form, tglSelesai: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"><option value="draft">draft</option><option value="aktif">aktif</option><option value="tutup">tutup</option></select></label>
            <label className="block md:col-span-2"><span className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</span><textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
          </div>
          <div className="flex gap-2">
            <button className={`px-6 py-3 font-semibold rounded-xl text-sm shadow-md text-white ${editingId ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-slate-900 hover:bg-slate-800 shadow-slate-200"}`}>{editingId ? "Simpan Perubahan" : "Tambah Periode"}</button>
            {editingId && <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm">Batal</button>}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div><h3 className="font-bold text-slate-900">Daftar Periode</h3><p className="text-slate-500 text-xs">Live via SSE.</p></div><span className="text-xs text-slate-400">{list.length} periode</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr><th className="py-4 px-6 font-semibold">Nama</th><th className="py-4 px-6 font-semibold">Tahun</th><th className="py-4 px-6 font-semibold">Periode</th><th className="py-4 px-6 font-semibold">Status</th><th className="py-4 px-6 font-semibold">ID</th><th className="py-4 px-6 font-semibold">Aksi</th></tr></thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {list.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/80 ${editingId === p.id ? "bg-indigo-50/60" : ""}`}>
                  <td className="py-4 px-6 font-semibold text-slate-800">{p.nama}{p.deskripsi && <div className="text-xs font-normal text-slate-400 line-clamp-1">{p.deskripsi}</div>}</td>
                  <td className="py-4 px-6">{p.tahun}</td>
                  <td className="py-4 px-6 text-xs whitespace-nowrap">{toDateInput(p.tglMulai)} — {toDateInput(p.tglSelesai)}</td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "tutup" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{p.status}</span></td>
                  <td className="py-4 px-6 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                  <td className="py-4 px-6"><div className="flex gap-1.5"><button onClick={() => startEdit(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${editingId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}>Ubah</button><button onClick={() => del(p.id)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold">Hapus</button></div></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Belum ada periode</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
