import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../lib/sse";

type Periode = { id: string; nama: string; tahun: number; tglMulai: string; tglSelesai: string; status: string; deskripsi?: string | null };

function toDateInput(v: string) {
  if (!v) return "";
  // handle "2026-08-01" or ISO "2026-08-01T00:00:00.000Z"
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

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
    setForm({
      nama: p.nama,
      tahun: p.tahun,
      tglMulai: toDateInput(p.tglMulai),
      tglSelesai: toDateInput(p.tglSelesai),
      status: p.status,
      deskripsi: p.deskripsi ?? "",
    });
    setErr(""); setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setErr(""); setMsg("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      if (editingId) {
        await apiFetch(`/periode/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
        setMsg("Periode diperbarui.");
        cancelEdit();
      } else {
        await apiFetch("/periode", { method: "POST", body: JSON.stringify(form) });
        setForm({ ...EMPTY, tahun: form.tahun, tglMulai: form.tglMulai, tglSelesai: form.tglSelesai, status: form.status });
        setMsg("Periode ditambahkan.");
      }
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus periode? Hanya bisa jika belum ada respons.")) return;
    try { await apiFetch(`/periode/${id}`, { method: "DELETE" }); setMsg("Periode dihapus."); load(); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{editingId ? "Ubah Periode" : "Kelola Periode Monev"}</h3>
            <p className="text-slate-500 text-xs mt-1">
              {editingId ? <>Mengubah <b className="text-slate-700">{form.nama || "periode terpilih"}</b> — ubah lalu simpan.</> : <>Multi periode aktif didukung. Link angket publik: <code className="bg-slate-100 px-1.5 py-0.5 rounded">/angket/:kode?periodeId=ID</code></>}
            </p>
          </div>
          {editingId && <button onClick={cancelEdit} className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Batal ubah</button>}
        </div>
        {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">{err}</div>}
        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">{msg}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Periode</span><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Monev RPL 2026 Ganjil" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium" required /></label>
            <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tahun</span><input type="number" value={form.tahun} onChange={(e) => setForm({ ...form, tahun: parseInt(e.target.value) || 2026 })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium" /></label>
            <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mulai</span><input type="date" value={form.tglMulai} onChange={(e) => setForm({ ...form, tglMulai: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium" /></label>
            <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Selesai</span><input type="date" value={form.tglSelesai} onChange={(e) => setForm({ ...form, tglSelesai: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium" /></label>
            <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium"><option value="draft">draft</option><option value="aktif">aktif</option><option value="tutup">tutup</option></select></label>
            <label className="block md:col-span-2"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deskripsi</span><textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium" /></label>
          </div>
          <div className="flex gap-2">
            <button className={`px-6 py-3 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 ${editingId ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"}`}>
              <i className={`fa-solid ${editingId ? "fa-floppy-disk" : "fa-plus"} text-xs`} /> {editingId ? "Simpan Perubahan" : "Tambah Periode"}
            </button>
            {editingId && <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs">Batal</button>}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div><h3 className="font-bold text-slate-800">Daftar Periode</h3><p className="text-slate-500 text-xs">Klik Ubah untuk mengedit. Live via SSE.</p></div><span className="text-xs text-slate-400">{list.length} periode</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100"><th className="py-4 px-6">Nama</th><th className="py-4 px-6">Tahun</th><th className="py-4 px-6">Periode</th><th className="py-4 px-6">Status</th><th className="py-4 px-6">ID (untuk link)</th><th className="py-4 px-6">Aksi</th></tr></thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {list.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/80 ${editingId === p.id ? "bg-indigo-50/60" : ""}`}>
                  <td className="py-4 px-6 font-semibold text-slate-800">{p.nama}{p.deskripsi && <div className="text-xs font-normal text-slate-400 line-clamp-1">{p.deskripsi}</div>}</td>
                  <td className="py-4 px-6">{p.tahun}</td>
                  <td className="py-4 px-6 text-xs whitespace-nowrap">{toDateInput(p.tglMulai)} — {toDateInput(p.tglSelesai)}</td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-lg text-xs font-bold border ${p.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "tutup" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{p.status}</span></td>
                  <td className="py-4 px-6 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${editingId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}>Ubah</button>
                      <button onClick={() => del(p.id)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold">Hapus</button>
                    </div>
                  </td>
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
