import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ShieldCheck, ArrowLeft } from "lucide-react";
import { apiFetch } from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try { await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); nav("/admin"); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-8 h-8 object-contain rounded-lg" />
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg hidden sm:flex items-center justify-center text-white shadow-sm"><ShieldCheck size={18} /></span>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Monev RPL</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"><ArrowLeft size={16} /> Beranda</Link>
        </div>
      </header>
      <div className="flex-1 min-h-[80vh] flex items-center justify-center px-4 py-8 animate-fade-in-up">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>
            <h2 className="text-2xl font-bold text-slate-900">Login Admin</h2>
            <p className="text-slate-500 mt-2 text-sm">Masuk untuk melihat hasil dan analitik.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@uin-radenfatah.ac.id" required autoComplete="email" className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
              </div>
            </div>
            {err && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">{err}</div>}
            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-md">
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">&larr; Kembali ke Beranda</Link>
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-6">Akses khusus admin. Hubungi LPM jika lupa password.</p>
        </div>
      </div>
      <footer className="py-6 text-center text-slate-400 text-sm font-medium"><p>&copy; {new Date().getFullYear()} Monev RPL — UIN Raden Fatah Palembang.</p></footer>
    </div>
  );
}
