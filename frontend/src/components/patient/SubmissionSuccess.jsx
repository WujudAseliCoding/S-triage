import { Link } from 'react-router-dom';
import { CircleCheck, Clock } from 'lucide-react';
import EmergencyBox from './EmergencyBox';
import { buttonOutlineClass } from '../../utils/styles';

function formatAge(submission) {
  if (submission.pakaiTanggalLahir && submission.tanggalLahir) {
    return `Lahir ${new Date(submission.tanggalLahir).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  }
  return `${submission.umur} ${submission.satuanUmur.toLowerCase()}`;
}

function formatNik(submission) {
  if (submission.tanpaNik || !submission.nik) return 'Tidak tersedia';
  return `•••• •••• •••• ${submission.nik.slice(-4)}`;
}

const STEPS = [
  ['Verifikasi identitas & kunjungan', 'Petugas memeriksa nomor antrean, identitas, dan keluhan Anda.', 'bg-amber-100 text-amber-800'],
  ['Penilaian kondisi (asesmen)', 'Petugas menilai kondisi Anda untuk menentukan prioritas layanan sebelum tiket diterbitkan.', 'bg-amber-100 text-amber-800'],
  ['Tiket antrean diterbitkan', 'Setelah kedua langkah selesai, Anda mendapat nomor tiket pribadi dan estimasi waktu tunggu bila tersedia. Nomor tiket bersifat tetap; urutan panggil dapat berubah sesuai urgensi klinis.', 'bg-emerald-100 text-emerald-800'],
];

export default function SubmissionSuccess({ submission }) {
  const queueNumber = submission?.nomorAntrean || submission?.nomor_antrean || submission?.referensi || '—';

  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <span className="inline-block rounded-md bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600">
          Pengajuan diterima
        </span>
        <span className="mt-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CircleCheck className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
          Keluhan berhasil diajukan
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Pengajuan Anda sudah tercatat ke dalam sistem antrean triase. Silakan menunggu konfirmasi dan pemanggilan oleh petugas.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <p className="text-sm font-medium text-slate-500">
          Nomor antrean <span className="text-xs font-normal text-amber-700">(Masih bisa berubah, menunggu verifikasi petugas)</span>
        </p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-brand-700">{queueNumber}</p>

        <div className="my-4 border-t border-slate-100" />

        <span className="inline-block rounded-md bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
          Menunggu verifikasi petugas
        </span>

        <dl className="mt-5 space-y-5">
          <div>
            <dt className="text-sm text-slate-500">Nama pasien</dt>
            <dd className="mt-1 text-base font-bold text-slate-900">{submission.nama}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Umur pasien</dt>
            <dd className="mt-1 text-base font-bold text-slate-900">{formatAge(submission)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">NIK • Tersamarkan</dt>
            <dd className="mt-1 text-base font-bold text-slate-900">{formatNik(submission)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Keluhan utama</dt>
            <dd className="mt-1 text-base font-bold leading-snug text-slate-900">{submission.keluhan}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">Apa yang terjadi selanjutnya?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pengajuan berhasil dikirim, tetapi belum berarti Anda sudah masuk antrean pelayanan. Masih ada
          dua langkah sebelum tiket antrean diterbitkan.
        </p>
        <ol className="mt-5 space-y-5">
          {STEPS.map(([title, text, badge], index) => (
            <li key={title} className="flex gap-3">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badge}`}>
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-lg bg-slate-100 p-4 text-sm leading-relaxed text-slate-600">
          Nomor antrean Anda bukan peringkat atau kode urgensi. Urutan panggil ditentukan petugas
          berdasarkan prioritas klinis, bukan urutan formulir masuk.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900">
          <Clock className="size-5 text-brand-700" aria-hidden="true" />
          Status antrean
        </h2>
        <dl className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm">
          {[
            ['Nomor antrean (Masih bisa berubah, menunggu verifikasi petugas)', queueNumber],
            ['Estimasi waktu tunggu', 'Menunggu asesmen'],
            ['Prioritas klinis', 'Ditentukan petugas'],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-slate-500">{term}</dt>
              <dd className="mt-1.5 inline-block w-full rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
          Informasi antrean di atas akan diperbarui setelah petugas menyelesaikan verifikasi dan asesmen kondisi Anda.
        </p>
      </section>

      <EmergencyBox />

      <Link to="/formulir" className={`${buttonOutlineClass} w-full border-brand-600 py-3.5 text-base text-brand-700`}>
        Kembali ke formulir
      </Link>
    </div>
  );
}
