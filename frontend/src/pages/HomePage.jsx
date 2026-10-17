import { useState, useEffect } from 'react';
import api from '../services/api';

export default function HomePage() {
  const [backendMsg, setBackendMsg] = useState('Memeriksa koneksi...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    api.get('/')
      .then((res) => {
        setBackendMsg(res.data.message || 'Terhubung');
        setIsConnected(true);
      })
      .catch((err) => {
        setBackendMsg('Gagal terhubung ke backend: ' + err.message);
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">S-Triage</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Base frontend siap dikembangkan dengan sistem desain baru.
        </p>

        <div className={`mt-6 p-3 rounded-lg text-xs font-medium border ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
        }`}>
          {backendMsg}
        </div>
      </div>
    </div>
  );
}
