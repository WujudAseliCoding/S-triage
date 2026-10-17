import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-extrabold text-slate-300 dark:text-slate-700">404</h1>
      <h2 className="text-xl font-semibold mt-4">Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-slate-500 mt-2">Halaman yang Anda tuju tidak tersedia.</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
