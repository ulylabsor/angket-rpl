import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      nav("/admin");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-transparent">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <img src="/logo-radenfatah.png" alt="UIN Raden Fatah Palembang" className="w-20 h-20 mx-auto object-contain" />
          <h1 className="text-xl font-extrabold text-slate-900 mt-4 leading-tight">UIN Raden Fatah Palembang</h1>
          <p className="text-sm font-bold text-indigo-600">Monev Angket RPL Tipe A</p>
          <p className="text-xs text-slate-400 mt-1">Masuk ke Panel Admin</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fa-solid fa-envelope" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@uin-radenfatah.ac.id"
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fa-solid fa-lock" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-medium"
              />
            </div>
          </div>
          {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Memproses..." : "Masuk"}</span> <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-6">Akses khusus admin. Hubungi LPM jika lupa password.</p>
      </div>
    </div>
  );
}
