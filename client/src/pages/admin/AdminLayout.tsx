import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

const NAV = [
  { to: "/admin", label: "Ringkasan Eksekutif", icon: "fa-house-chimney", id: "dash" },
  { to: "/admin/respons", label: "Tabel Rekapitulasi", icon: "fa-table-list", id: "recap" },
  { to: "/admin/rekap", label: "Rekap per Dimensi", icon: "fa-chart-simple", id: "rekap" },
  { to: "/admin/periode", label: "Kelola Periode", icon: "fa-folder-open", id: "surveys" },
  { to: "/admin/temuan", label: "Temuan & RTL", icon: "fa-magnifying-glass", id: "temuan" },
  { to: "/admin/pengguna", label: "Kelola Pengguna", icon: "fa-users-gear", id: "pengguna" },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  return pathname.startsWith(to);
}

export default function AdminLayout() {
  const [me, setMe] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { apiFetch("/auth/me").then(setMe).catch(() => nav("/admin/login")); }, []);

  const active = NAV.find((n) => isActive(loc.pathname, n.to));
  const pageTitle = active?.label ?? "Monev RPL";

  const logout = async () => { await apiFetch("/auth/logout", { method: "POST" }).catch(() => {}); nav("/admin/login"); };

  return (
    <div className="min-h-full flex bg-transparent relative overflow-hidden flex-1">
      {/* Sidebar — larger & more comfortable */}
      <aside className={`w-72 bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${sidebarOpen ? "absolute" : "absolute"} lg:relative h-full shadow-xl lg:shadow-none shrink-0`}>
        <div className="px-6 py-7 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah Palembang" className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0" />
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-[15px] leading-none tracking-tight">Monev RPL</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">UIN Raden Fatah Palembang · RPL Tipe A</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 grid place-items-center hover:bg-slate-200">
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-widest uppercase text-slate-400">Menu Utama</p>
          {NAV.map((n) => {
            const on = isActive(loc.pathname, n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-[13.5px] leading-none transition-all ${on ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <span className={`w-9 h-9 rounded-xl grid place-items-center text-sm shrink-0 ${on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <i className={`fa-solid ${n.icon}`} />
                </span>
                <span className="truncate">{n.label}</span>
                {on && <i className="fa-solid fa-chevron-right ml-auto text-[11px] opacity-60" />}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              <i className="fa-solid fa-user-shield" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{me?.nama ?? "Administrator"}</p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-0.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Online</p>
            </div>
            <button onClick={logout} title="Keluar" className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 grid place-items-center shrink-0">
              <i className="fa-solid fa-right-from-bracket text-sm" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        <header className="bg-white/95 backdrop-blur border-b border-slate-200 px-5 sm:px-7 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen((v) => !v)} className="lg:hidden w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black shadow-md shrink-0">
              <i className="fa-solid fa-bars" />
            </button>
            <div className="min-w-0">
              <h2 className="font-black text-slate-900 text-[17px] sm:text-[19px] leading-tight tracking-tight">{pageTitle}</h2>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">Monitoring real-time hasil isian angket responden.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/" className="hidden sm:inline-flex px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm">Lihat Situs</Link>
            <Link to="/" className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-200">
              <i className="fa-solid fa-plus" /> <span className="hidden sm:inline">Isi Form Angket</span><span className="sm:hidden">Form</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-7 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
