import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, ClipboardList, Users, LogOut, Menu, X, User } from "lucide-react";
import { apiFetch } from "../../lib/api";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/respons", label: "Data Responden", icon: ClipboardList },
  { to: "/admin/rekap", label: "Rekap per Dimensi", icon: LayoutDashboard },
  { to: "/admin/periode", label: "Kelola Periode", icon: ClipboardList },
  { to: "/admin/temuan", label: "Temuan & RTL", icon: ClipboardList },
  { to: "/admin/pengguna", label: "Kelola Pengguna", icon: Users },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  return pathname.startsWith(to);
}

export default function AdminLayout() {
  const [me, setMe] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { apiFetch("/auth/me").then(setMe).catch(() => nav("/admin/login")); }, []);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); else setIsSidebarOpen(true); };
    window.addEventListener("resize", onResize); onResize(); return () => window.removeEventListener("resize", onResize);
  }, []);
  const active = NAV.find((n) => isActive(loc.pathname, n.to));
  const pageTitle = active?.label ?? "Monev RPL";
  const logout = async () => { await apiFetch("/auth/logout", { method: "POST" }).catch(() => {}); nav("/admin/login"); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {isSidebarOpen && window.innerWidth < 768 && <div className="fixed inset-0 bg-slate-900/50 z-20" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} md:w-64 lg:w-72`}>
        <div className="h-20 flex items-center px-6 bg-slate-950/50 border-b border-slate-800 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><ShieldCheck size={20} /></div>
            <span className="font-extrabold text-xl text-white tracking-tight truncate">Monev RPL</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 mt-2">Menu Utama</p>
          <nav className="space-y-1">
            {NAV.map((n) => {
              const on = isActive(loc.pathname, n.to);
              return (
                <Link key={n.to} to={n.to} onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${on ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 hover:text-white text-slate-300"}`}>
                  <n.icon size={20} /> <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <div className="flex items-center px-4 py-3 mb-4 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 mr-3"><User size={20} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{me?.nama ?? "Administrator"}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online</p>
            </div>
            <button onClick={logout} title="Keluar" className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/30 grid place-items-center shrink-0"><LogOut size={16} /></button>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 px-4 py-3 rounded-xl font-medium transition-colors">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"><Menu size={24} /></button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">{pageTitle}</h1>
            <h1 className="text-base font-bold text-slate-800 sm:hidden">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm">Lihat Situs</Link>
            <Link to="/" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200">Isi Form</Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
