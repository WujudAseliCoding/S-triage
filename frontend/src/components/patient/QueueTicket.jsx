import { Check, Clock, HandHelping, Megaphone, TriangleAlert } from 'lucide-react';
import PriorityBadge from '../common/PriorityBadge';
import { PATIENT_TICKET } from '../../data/mockData';

const PROGRESS = [
  { label: 'Verifikasi', state: 'Selesai', done: true },
  { label: 'Asesmen', state: 'Selesai', done: true },
  { label: 'Menunggu', state: 'Saat ini', current: true },
  { label: 'Dipanggil', state: 'Berikutnya', next: true },
];

export default function QueueTicket({ patientName, referensi }) {
  const ticket = PATIENT_TICKET;

  return (
    <div className="space-y-4 px-4 py-6">
      <div>
        <span className="inline-block rounded-md bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600">
          Prototipe • Data simulasi
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Antrean Anda</h1>
        <p className="mt-2 text-base text-slate-600">Menunggu pemeriksaan. Verifikasi dan asesmen oleh petugas sudah selesai.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-slate-500">Nomor tiket Anda</p>
          <p className="mt-1 text-6xl font-extrabold tracking-tight text-brand-700">{ticket.nomorTiket}</p>
          <p className="mt-3 text-base font-bold text-slate-900">{patientName}</p>
          <p className="mt-1 text-xs text-slate-500">Referensi: {referensi}</p>
        </div>
        <div className="border-t border-slate-100 p-5">
          <PriorityBadge priority={ticket.priority} withDescription className="px-3 py-2 text-sm" />
          <p className="mt-3 text-sm text-slate-600">Ditetapkan petugas; dapat berubah setelah penilaian ulang.</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            Nomor antrean diurutkan mulai dari tingkat risiko paling tinggi; nomor dapat menyesuaikan
            bila prioritas triase berubah.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
          <Clock className="size-5" aria-hidden="true" />
          Menuju batas atas estimasi
        </p>
        <p className="mt-3 text-5xl font-extrabold tracking-tight text-brand-700">{ticket.sisaWaktu}</p>
        <p className="mt-2 text-sm text-brand-700">Menuju pukul {ticket.batasEstimasi} • Simulasi</p>

        <div className="mt-4 border-t border-brand-200 pt-4">
          <p className="text-sm text-slate-500">Perkiraan dipanggil</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{ticket.perkiraanDipanggil}</p>
          <p className="mt-1 text-sm text-slate-500">Sekitar 15–30 menit lagi</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Mulai menunggu</p>
              <p className="mt-1 font-bold text-slate-900">{ticket.mulaiMenunggu}</p>
            </div>
            <div>
              <p className="text-slate-500">Sudah menunggu</p>
              <p className="mt-1 font-bold text-slate-900">{ticket.sudahMenunggu}</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold text-brand-700">Perkiraan, bukan jaminan waktu pelayanan</p>
          <p className="mt-2 text-xs text-slate-500">
            Terakhir diperbarui {ticket.diperbarui}. Semua waktu adalah simulasi, bukan standar klinis.
          </p>
        </div>
      </section>

      <p className="px-1 text-base font-bold leading-snug text-slate-900">
        Kondisi memburuk? Segera beri tahu petugas, tanpa menunggu timer.
      </p>

      <section className="px-1">
        <h2 className="text-lg font-bold text-slate-900">Mengapa perkiraan bisa berubah?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pasien lebih gawat dapat didahulukan. Urutan panggil mengikuti prioritas klinis petugas dan
          kebutuhan layanan, bukan nomor semata.
        </p>
        <p className="mt-2 text-sm font-bold text-slate-900">
          Jika lewat {ticket.batasEstimasi} belum dipanggil, konfirmasi ke petugas untuk arahan berikutnya.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Selama menunggu</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Layanan</dt>
            <dd className="mt-1 text-base font-bold text-slate-900">{ticket.layanan}</dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-slate-500">Tempat menunggu</dt>
              <dd className="mt-1 text-base font-bold text-slate-900">{ticket.tempatMenunggu}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Saat dipanggil</dt>
              <dd className="mt-1 text-base font-bold text-slate-900">{ticket.ruang}</dd>
            </div>
          </div>
        </dl>

        <ol className="mt-5 border-t border-slate-100 pt-5">
          {PROGRESS.map((step, index) => (
            <li key={step.label} className="relative flex items-center gap-4 pb-5 last:pb-0">
              {index < PROGRESS.length - 1 && (
                <span className="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-slate-200" aria-hidden="true" />
              )}
              <span
                className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? 'bg-brand-50 text-brand-700'
                    : step.current
                      ? 'bg-brand-700 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step.done && <Check className="size-4" aria-hidden="true" />}
                {step.current && <Clock className="size-4" aria-hidden="true" />}
                {step.next && <Megaphone className="size-4" aria-hidden="true" />}
              </span>
              <span className={`flex-1 text-base ${step.current ? 'font-bold text-brand-700' : 'font-semibold text-slate-800'}`}>
                {step.label}
              </span>
              <span className={`text-sm ${step.current ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>
                {step.state}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl bg-slate-100 p-4 text-sm leading-relaxed">
          <p className="text-slate-800">
            Dengarkan panggilan petugas. Saat dipanggil, menuju {ticket.ruang}.
          </p>
          <p className="mt-2 text-slate-500">Jika panggilan terlewat, lapor kepada petugas.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-4" role="note">
        <p className="flex items-center gap-2 text-base font-bold text-red-700">
          <TriangleAlert className="size-5" aria-hidden="true" />
          Kondisi memburuk?
        </p>
        <p className="mt-2 text-sm font-bold text-red-700">
          Segera beri tahu petugas. Jangan menunggu timer atau panggilan.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-red-700/90">
          Sesak berat, nyeri dada berat, pingsan, atau perdarahan hebat adalah contoh tanda bahaya,
          bukan daftar lengkap.
        </p>
      </section>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-700 px-4 py-4 text-base font-bold text-white transition hover:bg-brand-800"
      >
        <HandHelping className="size-5" aria-hidden="true" />
        Minta bantuan petugas
      </button>
      <p className="px-1 text-sm leading-relaxed text-slate-600">
        Datang langsung ke meja petugas, atau minta pendamping memanggil petugas. Tombol contoh ini
        tidak mengirim permintaan bantuan.
      </p>
    </div>
  );
}
