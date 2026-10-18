import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  CircleCheck,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Card from '../../components/common/Card';
import PriorityBadge from '../../components/common/PriorityBadge';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import { buttonPrimaryClass } from '../../utils/styles';
import {
  ANALYTICS_STATS,
  DAILY_TREND,
  DOCTOR_VOLUME,
  SERVICE_TIMES,
  WEEKLY_URGENCY,
} from '../../data/mockData';
import { getAnalyticsStats, exportAnalyticsReport } from '../../services/dashboardService';

const STAT_ICONS = [
  { icon: Users, className: 'bg-brand-50 text-brand-600' },
  { icon: Clock, className: 'bg-amber-100 text-amber-600' },
  { icon: Globe, className: 'bg-blue-50 text-blue-600' },
  { icon: CircleCheck, className: 'bg-emerald-50 text-emerald-600' },
];

const REPORT_CARDS = [
  {
    type: 'triage',
    judul: 'Laporan Triase & Registrasi Pasien',
    format: 'CSV / Excel',
    aksi: 'Unduh CSV',
    tone: 'csv-red',
    icon: FileText,
    iconClass: 'text-red-500',
    desc: 'Rekapitulasi lengkap data pasien, keluhan, prioritas AI vs petugas, dan status verifikasi.',
  },
  {
    type: 'daily',
    judul: 'Rekapitulasi Kunjungan Harian',
    format: 'CSV / Excel',
    aksi: 'Unduh CSV',
    tone: 'csv-green',
    icon: FileSpreadsheet,
    iconClass: 'text-emerald-600',
    desc: 'Agregasi jumlah kunjungan per tanggal dengan klasifikasi prioritas P1, P2, P3, dan P0.',
  },
  {
    type: 'referrals',
    judul: 'Laporan Rujukan Keluar & SLA RS',
    format: 'CSV / Excel',
    aksi: 'Unduh CSV',
    tone: 'csv-amber',
    icon: FileText,
    iconClass: 'text-amber-500',
    desc: 'Riwayat pasien rujukan eksternal, faskes tujuan, alasan medis, dan status serah terima.',
  },
];

const PERIOD_OPTIONS = [
  { value: '30d', label: '30 Hari Terakhir' },
  { value: '7d', label: '7 Hari Terakhir' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'all', label: 'Semua Waktu' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(ANALYTICS_STATS);
  const [dailyTrend, setDailyTrend] = useState(DAILY_TREND);
  const [weeklyUrgency, setWeeklyUrgency] = useState(WEEKLY_URGENCY);
  const [doctorVolume, setDoctorVolume] = useState(DOCTOR_VOLUME);
  const [serviceTimes, setServiceTimes] = useState(SERVICE_TIMES);
  const [safetyMetrics, setSafetyMetrics] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [downloadingType, setDownloadingType] = useState(null);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    getAnalyticsStats({ period })
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.stats) setStats(data.stats);
        if (data.daily_trend && data.daily_trend.length > 0) setDailyTrend(data.daily_trend);
        if (data.weekly_urgency && data.weekly_urgency.length > 0) setWeeklyUrgency(data.weekly_urgency);
        if (data.doctor_volume && data.doctor_volume.length > 0) setDoctorVolume(data.doctor_volume);
        if (data.service_times && data.service_times.length > 0) setServiceTimes(data.service_times);
        if (data.safety_metrics) setSafetyMetrics(data.safety_metrics);
        setIsLive(true);
      })
      .catch((err) => {
        console.warn('Gagal memuat analitik live dari database:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [period]);

  const handleExport = async (type = 'triage') => {
    setDownloadingType(type);
    setExportNotice('');
    try {
      await exportAnalyticsReport(type);
      setExportNotice(`Laporan ${type} berhasil diunduh dalam format spreadsheet (CSV).`);
      setTimeout(() => setExportNotice(''), 4500);
    } catch (err) {
      console.error('Gagal mengunduh laporan:', err);
      setExportNotice('Gagal mengunduh laporan. Pastikan koneksi backend aktif.');
    } finally {
      setDownloadingType(null);
    }
  };

  const maxTrend = Math.max(...dailyTrend.map((d) => d.nilai), 1);
  const maxWeek = Math.max(...weeklyUrgency.map((w) => w.merah + w.kuning + w.hijau), 1);
  const maxDoctor = Math.max(...doctorVolume.map((d) => d.jumlah || 1), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Kontrol Header & Filter Periode ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="inline-flex cursor-pointer appearance-none items-center rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-slate-700 shadow-xs outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              aria-label="Pilih Periode Analitik"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Periode: {opt.label}
                </option>
              ))}
            </select>
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {isLive ? 'Live Supabase DB' : 'Data Cadangan'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleExport('triage')}
          disabled={downloadingType !== null}
          className={`${buttonPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Download className="size-4" aria-hidden="true" />
          {downloadingType === 'triage' ? 'Mengunduh…' : 'Ekspor agregat'}
        </button>
      </div>

      {exportNotice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"
          role="status"
        >
          ✓ {exportNotice}
        </div>
      )}

      {/* ── Kartu Ringkasan Statistik Utama ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const { icon: Icon, className } = STAT_ICONS[index] || STAT_ICONS[0];
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <span className={`flex size-7 items-center justify-center rounded-lg ${className}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p
                className={`mt-3 font-bold tracking-tight text-slate-900 ${
                  stat.small ? 'text-xl leading-9' : 'text-3xl'
                }`}
              >
                {stat.value}
              </p>
              <p className={`mt-2 text-xs ${stat.noteClass ?? 'text-slate-400'}`}>{stat.note}</p>
            </div>
          );
        })}
      </div>

      {/* ── Grafik Tren & Distribusi Tingkat Urgensi ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Tren Kunjungan Harian"
          subtitle="Data aktual database Supabase • Terintegrasi real-time"
          className="lg:col-span-3"
        >
          <div className="flex h-48 items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {dailyTrend.map((point) => (
              <div key={point.tanggal || point.tgl} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-2.5 rounded-full bg-brand-600 transition-all hover:bg-brand-500"
                  style={{ height: `${Math.max((point.nilai / maxTrend) * 100, 4)}%` }}
                  title={`${point.label || 'Tgl ' + point.tgl}: ${point.nilai} kunjungan`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            {dailyTrend.map((point) => (
              <span key={point.tanggal || point.tgl} className="flex-1 truncate text-center" title={point.label}>
                {point.label || `Tgl ${point.tgl}`}
              </span>
            ))}
          </div>
        </Card>

        <Card
          title="Distribusi Tingkat Urgensi"
          subtitle="Data aktual database Supabase • Terintegrasi real-time"
          className="lg:col-span-2"
        >
          <div className="mb-3 flex justify-end gap-3 text-[11px] font-medium text-slate-600">
            {['merah', 'kuning', 'hijau'].map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-sm ${TRIAGE_PRIORITY[key].barClass}`} aria-hidden="true" />
                {TRIAGE_PRIORITY[key].label}
              </span>
            ))}
          </div>
          <div className="flex h-44 items-end justify-around gap-3">
            {weeklyUrgency.map((week) => {
              const total = week.merah + week.kuning + week.hijau;
              return (
                <div key={week.minggu} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="flex w-7 flex-col overflow-hidden rounded-md bg-slate-100"
                    style={{ height: `${Math.max((total / maxWeek) * 100, 6)}%` }}
                    title={`${week.minggu}: ${total} pasien (Merah: ${week.merah}, Kuning: ${week.kuning}, Hijau: ${week.hijau})`}
                  >
                    {total > 0 ? (
                      <>
                        <div className="bg-red-500" style={{ flex: week.merah }} />
                        <div className="bg-amber-500" style={{ flex: week.kuning }} />
                        <div className="bg-emerald-500" style={{ flex: week.hijau }} />
                      </>
                    ) : (
                      <div className="h-full bg-slate-200" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{week.minggu}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Volume Dokter & Waktu Pelayanan ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Volume Layanan Dokter"
          subtitle="Jumlah antrean pasien yang ditangani per dokter"
          className="lg:col-span-3 lg:self-start"
        >
          <div className="space-y-3.5">
            {doctorVolume.map((doctor) => (
              <div key={doctor.nama} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-xs sm:grid-cols-[13rem_1fr_2.5rem] sm:text-sm">
                <span className="truncate font-medium text-slate-700">{doctor.nama}</span>
                <div className="h-3 overflow-hidden rounded-sm bg-slate-100">
                  <div
                    className="h-full rounded-sm bg-brand-600 transition-all hover:bg-brand-500"
                    style={{ width: `${Math.max((doctor.jumlah / maxDoctor) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-right font-bold text-slate-900">{doctor.jumlah}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Waktu Pelayanan & Respon"
          subtitle="Dihitung dari selisih waktu masuk hingga pemanggilan"
          className="lg:col-span-2"
        >
          <div className="divide-y divide-slate-100">
            {serviceTimes.map((item) => (
              <div key={item.priority} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={item.priority} withDescription className="uppercase" />
                  {item.achieved !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        item.achieved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      {item.achieved ? 'Target Tercapai' : 'Perlu Evaluasi'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.measure}</p>
                <p className={`text-lg font-bold ${TRIAGE_PRIORITY[item.priority]?.textClass || 'text-slate-900'}`}>
                  {item.value}
                </p>
                {item.target && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.target}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Unduh Laporan Agregat ── */}
      <Card title="Unduh Laporan Agregat (Sesuai Hak Akses Petugas)">
        <div className="grid gap-4 lg:grid-cols-3">
          {REPORT_CARDS.map((report) => {
            const Icon = report.icon;
            const isCurrentlyDownloading = downloadingType === report.type;
            return (
              <div key={report.judul} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
                <div className="flex items-start gap-3">
                  <Icon className={`size-7 shrink-0 ${report.iconClass}`} strokeWidth={1.6} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-slate-900">{report.judul}</p>
                    <p className="mt-1 text-xs text-slate-500">{report.desc}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Format: {report.format}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExport(report.type)}
                    disabled={downloadingType !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    {isCurrentlyDownloading ? 'Mengunduh…' : report.aksi}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Evaluasi Keselamatan Klinis & Validasi AI ── */}
      <Card title="Evaluasi Keselamatan Klinis & Kualitas Triase AI">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Under-Triage Rate</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {safetyMetrics?.under_triage_pct ?? 0}%
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Target akreditasi Kemenkes: &lt; 5%</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Over-Triage Rate</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {safetyMetrics?.over_triage_pct ?? 0}%
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Kewaspadaan awal triase AI: &lt; 30%</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Verifikasi Petugas Klinis</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">
              {safetyMetrics?.verified_count ?? 0} Pasien
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {safetyMetrics?.override_count ?? 0} override disertai alasan klinis
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Menunggu Verifikasi</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {safetyMetrics?.pending_count ?? 0} Pasien
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Antrean evaluasi perawat aktif</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            Data analitik dihitung otomatis dari database Supabase PostgreSQL. Rujukan diterima diverifikasi berkala hingga serah terima selesai.
          </span>
        </div>
      </Card>
    </div>
  );
}
