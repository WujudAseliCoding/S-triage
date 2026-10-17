import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, TrendingDown } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PriorityBadge from '../../components/common/PriorityBadge';
import ProgressBar from '../../components/common/ProgressBar';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import {
  DASHBOARD_STATS,
  PRIORITY_DISTRIBUTION,
  RECENT_VISITS,
} from '../../data/mockData';
import { getDashboardStats } from '../../services/dashboardService';

export default function DashboardPage() {
  const [stats, setStats] = useState(DASHBOARD_STATS);
  const [priorityDist, setPriorityDist] = useState(PRIORITY_DISTRIBUTION);
  const [recentVisits, setRecentVisits] = useState(RECENT_VISITS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.stats) setStats(data.stats);
        if (data.priority_distribution) setPriorityDist(data.priority_distribution);
        if (data.recent_visits && data.recent_visits.length > 0) setRecentVisits(data.recent_visits);
        setIsLive(true);
      })
      .catch((err) => {
        console.warn('Gagal memuat metrik live dashboard, menggunakan data cadangan:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPatients = priorityDist.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">
            {isLive ? '🟢 Terhubung ke Database PostgreSQL / Supabase' : 'Data simulasi • Prototipe FKTP'}
          </p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            {isLive ? 'Live Sync DB' : 'Simulasi'}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Merah: penanganan segera tanpa menunggu antrean. Keterisian &gt;85% hanya peringatan, bukan
          keputusan rujukan otomatis.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <span className={`flex size-7 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <span className={`size-2.5 rounded-full ${stat.dot}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-400">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card title="Distribusi Prioritas Triase" className="lg:col-span-3">
          <div className="space-y-4">
            {priorityDist.map(({ priority, count }) => {
              const data = TRIAGE_PRIORITY[priority] || TRIAGE_PRIORITY.hijau;
              return (
                <div key={priority}>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                    <span className={data.textClass}>
                      {data.label} — {data.description}
                    </span>
                    <span className="text-slate-900">{count} Pasien</span>
                  </div>
                  <ProgressBar value={Math.round((count / totalPatients) * 100)} barClass={data.barClass} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Status Pelayanan & Kapasitas" className="lg:col-span-2">
          <p className="text-xs text-slate-500">Waktu tunggu Kuning/Hijau</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-3xl font-bold tracking-tight text-slate-900">23 Menit</p>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <TrendingDown className="size-3.5" aria-hidden="true" />
              -4 menit
            </span>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-600">Keterisian Kapasitas</span>
              <span className="font-bold text-brand-700">78% Terisi</span>
            </div>
            <ProgressBar value={78} />
            <p className="mt-2 text-xs text-slate-400">Peringatan kapasitas jika &gt;85%</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Kunjungan Terkini • Terverifikasi"
          className="lg:col-span-3"
          action={
            <Link
              to="/antrean-live"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              Lihat Semua Antrean
            </Link>
          }
        >
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="rounded-l-lg px-3 py-2.5">Nama</th>
                  <th className="px-3 py-2.5">Prioritas Triase</th>
                  <th className="px-3 py-2.5">Dokter</th>
                  <th className="rounded-r-lg px-3 py-2.5">Status Pelayanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentVisits.map((visit) => (
                  <tr key={visit.id || visit.nama}>
                    <td className="px-3 py-3.5 font-semibold text-slate-900">{visit.nama}</td>
                    <td className="px-3 py-3.5">
                      <PriorityBadge priority={visit.priority} />
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">{visit.dokter}</td>
                    <td className="px-3 py-3.5">
                      <Badge tone={visit.statusTone}>{visit.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Rujukan & Luaran" className="lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <ArrowUpRight className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-red-700">2 Rujukan ke Fasilitas Lain</p>
                <p className="text-xs text-red-600/80">2 pasien dirujuk ke RSUD Dr. Pirngadi</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <ArrowRight className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-brand-700">1 Pasien Rujukan Masuk</p>
                <p className="text-xs text-brand-700/80">1 pasien dari Klinik Pratama Sinar Kasih</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card title="Pemantauan Penilaian Ulang" className="lg:col-span-3">
          <dl className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between gap-4">
              <dt className="text-red-700">Terakhir dinilai</dt>
              <dd className="text-slate-900">Lihat catatan pasien</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-amber-700">Jadwal penilaian ulang</dt>
              <dd className="text-slate-900">Mengikuti SOP fasilitas</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-700">Kondisi memburuk</dt>
              <dd className="text-slate-900">Eskalasi segera</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Prioritas akhir diverifikasi tenaga medis. AI hanya memberikan rekomendasi.
          </p>
        </Card>

        <Card title="Luaran Pasien" className="lg:col-span-2">
          <p className="text-xs text-slate-500">Luaran Meninggal Terkonfirmasi</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">0 pasien</p>

          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-600">Rujukan ke Fasilitas Lain</span>
                <span className="font-bold text-brand-700">2 pasien</span>
              </div>
              <ProgressBar value={35} />
              <p className="mt-1.5 text-[11px] text-slate-400">2 pasien dirujuk ke RSUD Dr. Pirngadi</p>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-600">Pasien Rujukan Masuk</span>
                <span className="font-bold text-brand-700">1 pasien</span>
              </div>
              <ProgressBar value={18} />
              <p className="mt-1.5 text-[11px] text-slate-400">1 pasien dari Klinik Pratama Sinar Kasih</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Luaran dicatat terpisah dari prioritas triase. Kematian hanya dikonfirmasi petugas medis
            berwenang.
          </p>
        </Card>
      </div>
    </div>
  );
}
