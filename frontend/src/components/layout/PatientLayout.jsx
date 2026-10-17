import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import Logo from '../common/Logo';
import { CLINIC_NAME } from '../../data/mockData';

// Layout mobile-first untuk pasien (tanpa login). Di desktop tampil sebagai kolom ponsel di tengah.
export default function PatientLayout() {
  return (
    <div className="min-h-screen bg-slate-200/60">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 md:border-x md:border-slate-200 md:shadow-sm">
        <header className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Untuk pasien
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="size-4 text-slate-400" aria-hidden="true" />
            {CLINIC_NAME}
          </p>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="px-5 pb-8 pt-2 text-xs leading-relaxed text-slate-500">
          <p>S-Triage • Prototipe layanan FKTP</p>
          <p className="mt-1">
            Antarmuka statis untuk peninjauan, bukan layanan klinis aktif.
          </p>
        </footer>
      </div>
    </div>
  );
}
