import { useMemo, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import { LIVE_QUEUE } from '../../data/mockData';
import { buttonOutlineClass } from '../../utils/styles';
import { getLiveQueue, callPatient, startServing, finishServing, cancelQueue } from '../../services/queueService';

const ALL_DOCTORS = 'Semua Dokter';

function QueueCard({ patient, onCall, onServe, onFinish, onCancel }) {
  const isRed = patient.priority === 'merah';
  const data = TRIAGE_PRIORITY[patient.priority] || TRIAGE_PRIORITY.hijau;
  const isCalling = patient.status === 'CALLING';

  return (
    <article className={`rounded-xl border bg-white p-4 shadow-xs ${data.cardClass}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">{patient.nama}</h3>
        {patient.nomor_antrean && (
          <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
            {patient.nomor_antrean}
          </span>
        )}
      </div>
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
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800">
              {isCalling ? '📢 Sedang Dipanggil ke Ruang Periksa' : 'Menunggu antrean'}
            </p>
            {isCalling && (
              <span className="animate-pulse rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                DIPANGGIL
              </span>
            )}
          </div>
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
              onClick={() => onCall && onCall(patient.id)}
              className={`rounded-lg px-3 py-2 text-xs font-bold text-white transition ${
                isCalling
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {isCalling ? 'Panggil Ulang' : 'Panggil pasien'}
            </button>
            <button type="button" className={`${buttonOutlineClass} px-3 py-2 text-xs`}>
              Nilai ulang
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onServe && onServe(patient.id)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Mulai Layani
            </button>
            <button
              type="button"
              onClick={() => onFinish && onFinish(patient.id)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Selesai
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
            <button type="button" className="text-left text-red-700 hover:underline">
              Kondisi memburuk
            </button>
            <button
              type="button"
              onClick={() => onCancel && onCancel(patient.id)}
              className="text-left text-slate-600 hover:underline"
            >
              Batalkan antrean
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function QueueColumn({ priority, patients, onCall, onServe, onFinish, onCancel, className = '' }) {
  const data = TRIAGE_PRIORITY[priority] || TRIAGE_PRIORITY.hijau;

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
          patients.map((patient) => (
            <QueueCard
              key={patient.id}
              patient={patient}
              onCall={onCall}
              onServe={onServe}
              onFinish={onFinish}
              onCancel={onCancel}
            />
          ))
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
  const [queueList, setQueueList] = useState(LIVE_QUEUE);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getLiveQueue()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        const mapped = data.map((q) => {
          let priority = 'hijau';
          if (q.patient?.prioritas_triage === 'P1') priority = 'merah';
          else if (q.patient?.prioritas_triage === 'P2') priority = 'kuning';

          const waktuMasuk = q.waktu_masuk || q.createdAt;
          const masukStr = waktuMasuk
            ? new Date(waktuMasuk).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '08:00';

          return {
            id: q.id,
            nama: q.patient?.nama_pasien || 'Anonim',
            keluhan: q.patient?.keluhan_utama || 'Keluhan umum',
            priority,
            dokter: q.dokter?.nama || 'Belum ditugaskan',
            masuk: masukStr,
            nomor_antrean: q.nomor_antrean,
            status: q.status,
          };
        });
        setQueueList(mapped);
        setIsLive(true);
      })
      .catch((err) => {
        console.warn('Gagal memuat antrean live dari database, menggunakan data cadangan:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCallPatient = async (queueId) => {
    try {
      await callPatient(queueId);
      setQueueList((prev) =>
        prev.map((q) => (q.id === queueId ? { ...q, status: 'CALLING' } : q))
      );
    } catch (err) {
      console.error('Gagal memanggil pasien:', err);
    }
  };

  const handleServe = async (queueId) => {
    try {
      await startServing(queueId);
      setQueueList((prev) =>
        prev.map((q) => (q.id === queueId ? { ...q, status: 'SERVING' } : q))
      );
    } catch (err) {
      console.error('Gagal memulai pelayanan:', err);
    }
  };

  const handleFinish = async (queueId) => {
    try {
      await finishServing(queueId);
      // Hapus dari daftar live queue setelah selesai
      setQueueList((prev) => prev.filter((q) => q.id !== queueId));
    } catch (err) {
      console.error('Gagal menyelesaikan pelayanan:', err);
    }
  };

  const handleCancel = async (queueId) => {
    try {
      await cancelQueue(queueId);
      // Hapus dari daftar live queue setelah dibatalkan
      setQueueList((prev) => prev.filter((q) => q.id !== queueId));
    } catch (err) {
      console.error('Gagal membatalkan antrean:', err);
    }
  };

  const doctorOptions = useMemo(
    () => [ALL_DOCTORS, ...new Set(queueList.map((patient) => patient.dokter))],
    [queueList],
  );

  const filtered = queueList.filter(
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
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-600" aria-hidden="true" />
            {isLive ? 'Live DB Supabase' : 'Data Cadangan'}
          </span>
        </div>
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

      <QueueColumn
        priority="merah"
        patients={byPriority('merah')}
        onCall={handleCallPatient}
        onServe={handleServe}
        onFinish={handleFinish}
        onCancel={handleCancel}
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <QueueColumn
          priority="kuning"
          patients={byPriority('kuning')}
          onCall={handleCallPatient}
          onServe={handleServe}
          onFinish={handleFinish}
          onCancel={handleCancel}
        />
        <QueueColumn
          priority="hijau"
          patients={byPriority('hijau')}
          onCall={handleCallPatient}
          onServe={handleServe}
          onFinish={handleFinish}
          onCancel={handleCancel}
        />
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
