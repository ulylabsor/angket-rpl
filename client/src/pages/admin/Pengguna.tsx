import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type User = { id: string; email: string; nama: string; role: string; createdAt: string };

export default function PenggunaPage() {
  const [list, setList] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", nama: "", role: "ADMIN_MONEV" as string, password: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", nama: "", role: "ADMIN_MONEV" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => apiFetch<User[]>("/users").then(setList).catch((e: any) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setMsg("");
    try { await apiFetch("/users", { method: "POST", body: JSON.stringify(form) }); setForm({ email: "", nama: "", role: "ADMIN_MONEV", password: "" }); setMsg(form.password?.trim() ? "Pengguna dibuat." : "Pengguna dibuat — password default: 123"); load(); } catch (e: any) { setErr(e.message); }
  };
  const startEdit = (u: User) => { setEditId(u.id); setEditForm({ email: u.email, nama: u.nama, role: u.role }); setErr(""); setMsg(""); };
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editId) return;
    try { await apiFetch(`/users/${editId}`, { method: "PUT", body: JSON.stringify(editForm) }); setEditId(null); load(); setMsg("Data pengguna diperbarui."); } catch (e: any) { setErr(e.message); }
  };
  const resetPw = async (id: string) => {
    const custom = prompt('Reset password — kosongkan untuk default "123", atau isi password baru:') ?? null;
    if (custom === null) return;
    const body = custom.trim() ? { password: custom.trim() } : {};
    try { const r: any = await apiFetch(`/users/${id}/reset-password`, { method: "PATCH", body: JSON.stringify(body) }); setMsg(r.message ?? "Password direset."); } catch (e: any) { setErr(e.message); }
  };
  const del = async (id: string) => {
    if (!confirm("Hapus pengguna ini?")) return;
    try { await apiFetch(`/users/${id}`, { method: "DELETE" }); load(); setMsg("Pengguna dihapus."); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Kelola Pengguna</h2>
        <p className="text-slate-500 text-sm mt-1">Tambah/ubah pengguna admin. Kosongkan password = default 123.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        {err && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{err}</div>}
        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">{msg}</div>}
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@uin-radenfatah.ac.id" type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Nama</span><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Peran</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"><option value="ADMIN_MONEV">Admin Monev</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
            <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Password <span className="font-normal text-slate-400">(kosongkan = 123)</span></span><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="default 123" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" /></label>
          </div>
          <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-md">Tambah Pengguna</button>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-900">Daftar Pengguna</h3><p className="text-slate-500 text-xs">{list.length} akun</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr><th className="py-4 px-6 font-semibold">Nama / Email</th><th className="py-4 px-6 font-semibold">Peran</th><th className="py-4 px-6 font-semibold">Dibuat</th><th className="py-4 px-6 font-semibold">Aksi</th></tr></thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80">
                  <td className="py-4 px-6">
                    {editId === u.id ? (
                      <form onSubmit={submitEdit} className="space-y-2">
                        <input value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="ADMIN_MONEV">Admin Monev</option><option value="SUPER_ADMIN">Super Admin</option></select>
                        <div className="flex gap-2"><button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Simpan</button><button type="button" onClick={() => setEditId(null)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs">Batal</button></div>
                      </form>
                    ) : (<><div className="font-semibold text-slate-800">{u.nama}</div><div className="text-xs text-slate-500">{u.email}</div></>)}
                  </td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${u.role === "SUPER_ADMIN" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 border-slate-200"}`}>{u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Monev"}</span></td>
                  <td className="py-4 px-6 text-xs">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-4 px-6">
                    {editId !== u.id && <div className="flex flex-wrap gap-1.5"><button onClick={() => startEdit(u)} className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50">Ubah</button><button onClick={() => resetPw(u.id)} className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-bold">Reset password</button><button onClick={() => del(u.id)} className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold">Hapus</button></div>}
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Belum ada pengguna</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
