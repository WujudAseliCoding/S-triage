import {
  Calendar,
  ChevronDown,
  CircleCheck,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
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
  REPORT_DOWNLOADS,
  SERVICE_TIMES,
  WEEKLY_URGENCY,
} from '../../data/mockData';

const STAT_ICONS = [
  { icon: Users, className: 'bg-brand-50 text-brand-600' },
  { icon: Clock, className: 'bg-amber-100 text-amber-600' },
  { icon: Globe, className: 'bg-blue-50 text-blue-600' },
  { icon: CircleCheck, className: 'bg-emerald-50 text-emerald-600' },
];

const REPORT_ICON = {
  pdf: { icon: FileText, className: 'text-red-500' },
  xlsx: { icon: FileSpreadsheet, className: 'text-emerald-600' },
  'pdf-alt': { icon: FileText, className: 'text-amber-500' },
};

const MAX_TREND = Math.max(...DAILY_TREND.map((d) => d.nilai));
const MAX_DOCTOR = Math.max(...DOCTOR_VOLUME.map((d) => d.jumlah));
const MAX_WEEK = Math.max(...WEEKLY_URGENCY.map((w) => w.merah + w.kuning + w.hijau));

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          <Calendar className="size-4 text-slate-500" aria-hidden="true" />
          Periode: 1 Sep 2026 - 27 Sep 2026
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </button>
        <button type="button" className={buttonPrimaryClass}>
          <Download className="size-4" aria-hidden="true" />
          Ekspor agregat
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {ANALYTICS_STATS.map((stat, index) => {
          const { icon: Icon, className } = STAT_ICONS[index];
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

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Tren Kunjungan Harian (Sep 2026)"
          subtitle="Data simulasi • Belum tervalidasi klinis"
          className="lg:col-span-3"
        >
          <div className="flex h-48 items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {DAILY_TREND.map((point) => (
              <div key={point.tgl} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-2.5 rounded-full bg-brand-600"
                  style={{ height: `${(point.nilai / MAX_TREND) * 100}%` }}
                  title={`Tgl ${point.tgl}: ${point.nilai} kunjungan`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            {DAILY_TREND.map((point) => (
              <span key={point.tgl} className="flex-1 text-center">
                Tgl {point.tgl}
              </span>
            ))}
          </div>
        </Card>

        <Card
          title="Distribusi Tingkat Urgensi"
          subtitle="Data simulasi • Belum tervalidasi klinis"
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
            {WEEKLY_URGENCY.map((week) => {
              const total = week.merah + week.kuning + week.hijau;
              return (
                <div key={week.minggu} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="flex w-7 flex-col overflow-hidden rounded-md"
                    style={{ height: `${(total / MAX_WEEK) * 100}%` }}
                    title={`${week.minggu}: ${total} pasien`}
                  >
                    <div className="bg-red-500" style={{ flex: week.merah }} />
                    <div className="bg-amber-500" style={{ flex: week.kuning }} />
                    <div className="bg-emerald-500" style={{ flex: week.hijau }} />
                  </div>
                  <span className="text-[11px] text-slate-500">{week.minggu}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card title="Volume Layanan Dokter • Data simulasi" className="lg:col-span-3 lg:self-start">
          <div className="space-y-3.5">
            {DOCTOR_VOLUME.map((doctor) => (
              <div key={doctor.nama} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-xs sm:grid-cols-[13rem_1fr_2.5rem] sm:text-sm">
                <span className="truncate text-slate-700">{doctor.nama}</span>
                <div className="h-3 overflow-hidden rounded-sm bg-slate-100">
                  <div
                    className="h-full rounded-sm bg-brand-600"
                    style={{ width: `${(doctor.jumlah / MAX_DOCTOR) * 100}%` }}
                  />
                </div>
                <span className="text-right font-bold text-slate-900">{doctor.jumlah}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Waktu pelayanan • Data simulasi" className="lg:col-span-2">
          <div className="divide-y divide-slate-100">
            {SERVICE_TIMES.map((item) => (
              <div key={item.priority} className="py-4 first:pt-0 last:pb-0">
                <PriorityBadge priority={item.priority} withDescription className="uppercase" />
                <p className="mt-2 text-sm text-slate-600">{item.measure}</p>
                <p className={`text-lg font-bold ${TRIAGE_PRIORITY[item.priority].textClass}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Unduh Laporan Agregat (sesuai hak akses)">
        <div className="grid gap-4 lg:grid-cols-3">
          {REPORT_DOWNLOADS.map((report) => {
            const { icon: Icon, className } = REPORT_ICON[report.tone];
            return (
              <div key={report.judul} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <Icon className={`size-7 shrink-0 ${className}`} strokeWidth={1.6} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug text-slate-900">{report.judul}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format: {report.format} • Data simulasi • Belum tervalidasi klinis
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  {report.aksi}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Evaluasi keselamatan & luaran">
        <div className="space-y-1 text-xs text-slate-500">
          <p>Under-triage: belum tersedia • Over-triage: belum tersedia</p>
          <p>Verifikasi tenaga medis: belum tersedia • Penilaian ulang: belum tersedia</p>
          <p>Meninggal terkonfirmasi: belum tersedia; dicatat terpisah dari kategori urgensi.</p>
          <p>
            Rujukan diterima ≠ serah terima selesai. Semua angka/grafik pada layar ini adalah simulasi.
          </p>
        </div>
      </Card>
    </div>
  );
}
