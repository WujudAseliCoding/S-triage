import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, LogOut, Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { STAFF_NAV } from '../../utils/staffNav';
import { CLINIC_NAME } from '../../data/mockData';

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentTitle = STAFF_NAV.find((item) => pathname.startsWith(item.to))?.title ?? 'S-Triage';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-70">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-70 flex-col border-r border-slate-200 bg-white px-5 py-5 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Logo subtitle="TRIAGE CERDAS AI" />
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Navigasi utama">
          {STAFF_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {isActive && <span className="h-5 w-1 rounded-full bg-brand-600" aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-1 pt-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-800 text-[10px] font-bold text-white">
            LGN
          </span>
          <div className="text-[11px] leading-tight">
            <p className="font-semibold text-slate-700">Loncat ga nih™</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </button>

        <span className="hidden items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex">
          <Building2 className="size-3.5" aria-hidden="true" />
          {CLINIC_NAME}
        </span>
        <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{currentTitle}</h1>

        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          <span className="hidden items-center gap-2 text-xs font-medium text-slate-600 md:inline-flex">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Sistem Aktif
          </span>
          <button
            type="button"
            className="rounded-full bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell className="size-5" strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.nama}</p>
              <p className="text-xs text-slate-400">{user?.jabatan}</p>
            </div>
            <Avatar name={user?.nama ?? 'Petugas'} size="md" />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="size-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
