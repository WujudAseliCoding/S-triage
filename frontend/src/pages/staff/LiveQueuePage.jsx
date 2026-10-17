import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import { LIVE_QUEUE } from '../../data/mockData';
import { buttonOutlineClass } from '../../utils/styles';

const ALL_DOCTORS = 'Semua Dokter';

function QueueCard({ patient }) {
  const isRed = patient.priority === 'merah';
  const data = TRIAGE_PRIORITY[patient.priority];

  return (
    <article className={`rounded-xl border bg-white p-4 shadow-xs ${data.cardClass}`}>
      <h3 className="text-sm font-bold text-slate-900">{patient.nama}</h3>
      <p className="mt-0.5 text-xs text-slate-600">{patient.keluhan}</p>

      {isRed ? (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-red-700">Status: penanganan segera</p>
            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              PJ belum konfirmasi
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">PJ: {patient.dokter}</p>
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>Masuk: {patient.masuk}</span>
            <span className="text-slate-600">{patient.dokter}</span>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500">
            <p>Waktu mulai tindakan: belum dicatat</p>
            <p>Petugas: belum mengonfirmasi penerimaan</p>
          </div>
          <span className="mt-3 inline-block rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
            Catatan belum lengkap
          </span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
            >
              Eskalasi petugas
            </button>
            <button type="button" className={`${buttonOutlineClass} px-3 py-2 text-xs`}>
              Catat tindakan
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-xs font-bold text-slate-800">
            Simulasi: menunggu • verifikasi belum terdokumentasi
          </p>
          <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
            Catatan belum lengkap
          </span>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>Masuk: {patient.masuk}</span>
            <span className="text-slate-600">{patient.dokter}</span>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500">
            <p>Asesmen terakhir: belum dicatat</p>
            <p>Penilaian ulang: mengikuti SOP fasilitas</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
            >
              Panggil pasien
            </button>
            <button type="button" className={`${buttonOutlineClass} px-3 py-2 text-xs`}>
              Nilai ulang
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
            <button type="button" className="text-left text-red-700 hover:underline">
              Kondisi memburuk
            </button>
            <button type="button" className="text-left text-slate-600 hover:underline">
              Tunda dengan alasan
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function QueueColumn({ priority, patients, className = '' }) {
  const data = TRIAGE_PRIORITY[priority];

  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${data.panelClass} ${className}`}>
      <header className="flex items-center justify-between border-b border-black/5 pb-3">
        <h2 className={`text-sm font-bold uppercase ${data.textClass}`}>
          {data.label} — {data.description}
        </h2>
        <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${data.countClass}`}>
          {patients.length}
        </span>
      </header>
      <div className={`mt-4 grid gap-4 ${priority === 'merah' ? 'md:grid-cols-2' : ''}`}>
        {patients.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">Tidak ada pasien pada kategori ini.</p>
        ) : (
          patients.map((patient) => <QueueCard key={patient.id} patient={patient} />)
        )}
      </div>
    </section>
  );
}

function InfoPanel({ title, children, tone = 'default' }) {
  return (
    <section
      className={`rounded-2xl border px-6 py-5 ${
        tone === 'danger' ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white'
      }`}
    >
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <div className="mt-2 text-xs leading-relaxed text-slate-500">{children}</div>
    </section>
  );
}

export default function LiveQueuePage() {
  const [selectedDoctor, setSelectedDoctor] = useState(ALL_DOCTORS);

  const doctorOptions = useMemo(
    () => [ALL_DOCTORS, ...new Set(LIVE_QUEUE.map((patient) => patient.dokter))],
    [],
  );

  const filtered = LIVE_QUEUE.filter(
    (patient) => selectedDoctor === ALL_DOCTORS || patient.dokter === selectedDoctor,
  );
  const byPriority = (priority) => filtered.filter((patient) => patient.priority === priority);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <label htmlFor="filter-dokter" className="sr-only">
              Filter dokter
            </label>
            <select
              id="filter-dokter"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {doctorOptions.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <span className="size-1.5 rounded-full bg-brand-600" aria-hidden="true" />
            Tampilan Kanban
          </span>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
          Simulasi operasional • Urutan panggil dinamis
        </span>
      </div>

      <InfoPanel title="Merah tidak masuk antrean biasa • Tidak menggunakan timer biasa" tone="danger">
        Penanganan segera tanpa menunggu antrean, AI, atau administrasi. Tiket kunjungan hanya
        identitas, bukan syarat darurat. Eskalasi petugas dan catat waktu tindakan.
      </InfoPanel>

      <InfoPanel title="Penerimaan pengajuan pasien • Estimasi pasien">
        Belum ada pengajuan terhubung. Petugas mencocokkan identitas/no. RM, memverifikasi data, lalu
        melakukan asesmen. Pengajuan tidak otomatis mendapat prioritas Hijau. Tampilan publik hanya
        nomor panggil dan lokasi, bukan nama, NIK, atau keluhan. Nomor tiket tetap; urutan panggil
        berubah berdasarkan klasifikasi urgensi dan keputusan petugas.
      </InfoPanel>

      <InfoPanel title="Pemantauan estimasi pasien">
        <p>
          Nomor tiket tetap; urutan panggil berubah berdasarkan klasifikasi urgensi dan keputusan
          petugas. Tidak ada janji waktu maksimal absolut.
        </p>
        <dl className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
          {[
            ['Nomor tiket pasien', 'Belum tersedia'],
            ['Perkiraan rentang waktu', 'Belum tersedia'],
            ['Sumber & waktu update', 'Belum tersedia'],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-sm font-bold text-slate-900">{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <p className="pt-1 text-[11px]">
            Estimasi belum tersedia: jangan tampilkan countdown. Belum dinilai → asesmen; merah →
            penanganan segera. Batas atas perkiraan bukan jadwal penilaian ulang atau batas aman
            klinis. Estimasi terlewati → tindak lanjut dan eskalasi petugas. Data usang/koneksi
            terputus → hentikan proyeksi timer, tampilkan update terakhir dan hubungi petugas. Waktu
            tunggu kumulatif tidak direset.
          </p>
        </dl>
      </InfoPanel>

      <QueueColumn priority="merah" patients={byPriority('merah')} />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <QueueColumn priority="kuning" patients={byPriority('kuning')} />
        <QueueColumn priority="hijau" patients={byPriority('hijau')} />
      </div>

      <InfoPanel title="Luaran kunjungan • terpisah dari antrean">
        <p>
          Meninggal terkonfirmasi: 0 • Data simulasi. Tidak ada pasien aktif yang diubah menjadi
          meninggal.
        </p>
        <div className="mt-2 flex flex-wrap justify-between gap-2">
          <span>Petugas berwenang: belum ada</span>
          <span>Waktu konfirmasi: belum ada</span>
        </div>
        <p className="mt-2">
          Catat luaran terkonfirmasi • Hitam sesuai SOP fasilitas, bukan keputusan AI. Expectant tidak
          disamakan dengan meninggal.
        </p>
      </InfoPanel>

      <InfoPanel title="Penundaan & riwayat perubahan">
        Pasien: belum dipilih • Alasan penundaan: wajib diisi • Petugas/waktu: tercatat saat disimpan.
        Riwayat perubahan menampilkan petugas, waktu, alasan, nilai sebelum, dan nilai sesudah. Waktu
        tunggu kumulatif tidak direset.
      </InfoPanel>
    </div>
  );
}
