import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Pencil, Trash, TriangleAlert, X } from 'lucide-react';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import { LIVE_QUEUE } from '../../data/mockData';
import { buttonOutlineClass } from '../../utils/styles';
import {
  getLiveQueue,
  callPatient,
  startServing,
  finishServing,
  escalateQueue,
  recordAction,
  deleteQueue,
} from '../../services/queueService';

const ALL_DOCTORS = 'Semua Dokter';

const formatClock = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function QueueCard({ patient, onCall, onServe, onFinish, onEdit, onDelete, onEscalate, onRecord, busy }) {
  const isRed = patient.priority === 'merah';
  const data = TRIAGE_PRIORITY[patient.priority] || TRIAGE_PRIORITY.hijau;
  const isCalling = patient.status === 'CALLING';

  return (
    <article className={`rounded-xl border bg-white p-4 shadow-xs ${data.cardClass}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-bold text-slate-900">{patient.nama}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {patient.nomor_antrean && (
            <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
              {patient.nomor_antrean}
            </span>
          )}
          <button
            type="button"
            onClick={() => onEdit && onEdit(patient)}
            title="Edit registrasi"
            aria-label={`Edit registrasi ${patient.nama}`}
            className="rounded-md p-1 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(patient)}
            title="Hapus data"
            aria-label={`Hapus data ${patient.nama}`}
            className="rounded-md p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-xs text-slate-600">{patient.keluhan}</p>

      {isRed ? (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-red-700">Status: penanganan segera</p>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                isCalling ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isCalling ? 'Eskalasi terkirim' : 'PJ belum konfirmasi'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">PJ: {patient.dokter}</p>
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>Masuk: {patient.masuk}</span>
            <span className="text-slate-600">{patient.dokter}</span>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500">
            <p>
              Waktu mulai tindakan:{' '}
              {patient.catatan_tindakan ? 'sudah dicatat' : 'belum dicatat'}
            </p>
            <p>
              Petugas:{' '}
              {isCalling
                ? `eskalasi terkirim${patient.waktu_panggil ? ` • ${patient.waktu_panggil}` : ''}`
                : 'belum mengonfirmasi penerimaan'}
            </p>
          </div>
          {patient.catatan_tindakan && (
            <p className="mt-2 rounded-lg bg-white/80 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
              Tindakan: {patient.catatan_tindakan}
            </p>
          )}
          <span className="mt-3 inline-block rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
            Catatan belum lengkap
          </span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onEscalate && onEscalate(patient.id)}
              className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isCalling ? 'Kirim ulang eskalasi' : 'Eskalasi petugas'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRecord && onRecord(patient)}
              className={`${buttonOutlineClass} px-3 py-2 text-xs disabled:cursor-not-allowed`}
            >
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
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onCall && onCall(patient.id)}
              className={`w-full rounded-lg px-3 py-2 text-xs font-bold text-white transition ${
                isCalling
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {isCalling ? 'Panggil Ulang' : 'Panggil pasien'}
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
          <div className="mt-3 text-xs font-bold">
            <button type="button" className="text-left text-red-700 hover:underline">
              Kondisi memburuk
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function QueueColumn({ priority, patients, onCall, onServe, onFinish, onEdit, onDelete, onEscalate, onRecord, busyId, className = '' }) {
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
      <div
        className={`mt-4 grid gap-4 ${
          priority === 'merah' ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {patients.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">Tidak ada pasien pada kategori ini.</p>
        ) : (
          patients.map((patient) => (
            <QueueCard
              key={patient.id}
              patient={patient}
              busy={busyId === patient.id}
              onCall={onCall}
              onServe={onServe}
              onFinish={onFinish}
              onEdit={onEdit}
              onDelete={onDelete}
              onEscalate={onEscalate}
              onRecord={onRecord}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ModalShell({ children, onClose, labelledBy }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({ patient, busy, onCancel, onConfirm }) {
  return (
    <ModalShell onClose={busy ? undefined : onCancel} labelledBy="confirm-delete-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="confirm-delete-title" className="text-base font-bold text-slate-900">
            Hapus data pasien?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Data registrasi <span className="font-semibold text-slate-900">{patient.nama}</span>
            {patient.nomor_antrean ? ` (${patient.nomor_antrean})` : ''} beserta antreannya akan
            dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={buttonOutlineClass}>
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {busy ? 'Menghapus...' : 'Ya, hapus'}
        </button>
      </div>
    </ModalShell>
  );
}

function RecordActionDialog({ patient, note, busy, onChange, onCancel, onConfirm }) {
  return (
    <ModalShell onClose={busy ? undefined : onCancel} labelledBy="record-action-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="record-action-title" className="text-base font-bold text-slate-900">
            Catat tindakan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {patient.nama}
            {patient.nomor_antrean ? ` • ${patient.nomor_antrean}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
          aria-label="Tutup"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <label htmlFor="catatan-tindakan" className="mt-4 mb-1.5 block text-xs font-semibold text-slate-700">
        Tindakan yang dilakukan
      </label>
      <textarea
        id="catatan-tindakan"
        rows={4}
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Contoh: Pemasangan oksigen 3 lpm, pemantauan tanda vital tiap 15 menit..."
        className="block w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none"
      />
      <p className="mt-2 text-[11px] text-slate-400">
        Waktu tindakan dicatat otomatis saat disimpan. Status antrean berubah menjadi sedang dilayani.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={buttonOutlineClass}>
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || !note.trim()}
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? 'Menyimpan...' : 'Simpan tindakan'}
        </button>
      </div>
    </ModalShell>
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
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState(ALL_DOCTORS);
  const [queueList, setQueueList] = useState(LIVE_QUEUE);
  const [isLive, setIsLive] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

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
          const masukStr = formatClock(waktuMasuk) || '08:00';

          return {
            id: q.id,
            patientId: q.patient?.id,
            nama: q.patient?.nama_pasien || 'Anonim',
            keluhan: q.patient?.keluhan_utama || 'Keluhan umum',
            priority,
            dokter: q.dokter?.nama || 'Belum ditugaskan',
            masuk: masukStr,
            nomor_antrean: q.nomor_antrean,
            status: q.status,
            waktu_panggil: formatClock(q.waktu_panggil),
            catatan_tindakan: q.catatan_tindakan || '',
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

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const updateQueueItem = (queueId, patch) =>
    setQueueList((prev) => prev.map((q) => (q.id === queueId ? { ...q, ...patch } : q)));

  const handleCallPatient = async (queueId) => {
    setErrorMessage('');
    try {
      await callPatient(queueId);
      updateQueueItem(queueId, { status: 'CALLING' });
    } catch (err) {
      console.error('Gagal memanggil pasien:', err);
      setErrorMessage('Gagal memanggil pasien. Coba lagi.');
    }
  };

  const handleServe = async (queueId) => {
    setErrorMessage('');
    try {
      await startServing(queueId);
      updateQueueItem(queueId, { status: 'SERVING' });
    } catch (err) {
      console.error('Gagal memulai pelayanan:', err);
      setErrorMessage('Gagal memulai pelayanan. Coba lagi.');
    }
  };

  const handleFinish = async (queueId) => {
    setErrorMessage('');
    try {
      await finishServing(queueId);
      // Hapus dari daftar live queue setelah selesai
      setQueueList((prev) => prev.filter((q) => q.id !== queueId));
    } catch (err) {
      console.error('Gagal menyelesaikan pelayanan:', err);
      setErrorMessage('Gagal menyelesaikan pelayanan. Coba lagi.');
    }
  };

  // Tombol edit mengarahkan ke halaman registrasi dengan data pasien yang sudah terisi
  const handleEdit = (patient) => {
    const targetId = patient.patientId || patient.id;
    navigate(`/registrasi-triase?edit=${targetId}`);
  };

  const handleEscalate = async (queueId) => {
    setBusyId(queueId);
    setErrorMessage('');
    try {
      const updated = await escalateQueue(queueId);
      updateQueueItem(queueId, {
        status: updated?.status || 'CALLING',
        waktu_panggil: formatClock(updated?.waktu_panggil) || formatClock(new Date()),
      });
      setNotice('Eskalasi petugas berhasil dikirim.');
    } catch (err) {
      console.error('Gagal mengirim eskalasi petugas:', err);
      setErrorMessage('Gagal mengirim eskalasi petugas. Coba lagi.');
    } finally {
      setBusyId(null);
    }
  };

  const openRecordAction = (patient) => {
    setErrorMessage('');
    setActionTarget(patient);
    setActionNote(patient.catatan_tindakan || '');
  };

  const handleRecordAction = async () => {
    if (!actionTarget) return;
    setActionBusy(true);
    setErrorMessage('');
    try {
      const updated = await recordAction(actionTarget.id, { catatan_tindakan: actionNote.trim() });
      updateQueueItem(actionTarget.id, {
        status: updated?.status || 'SERVING',
        catatan_tindakan: updated?.catatan_tindakan ?? actionNote.trim(),
      });
      setNotice('Tindakan berhasil dicatat.');
      setActionTarget(null);
      setActionNote('');
    } catch (err) {
      console.error('Gagal mencatat tindakan:', err);
      setErrorMessage('Gagal mencatat tindakan. Coba lagi.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setErrorMessage('');
    try {
      await deleteQueue(deleteTarget.id);
      setQueueList((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setNotice('Data pasien dan antrean berhasil dihapus.');
      setDeleteTarget(null);
    } catch (err) {
      console.error('Gagal menghapus data:', err);
      setErrorMessage('Gagal menghapus data. Coba lagi.');
    } finally {
      setDeleteBusy(false);
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

      {notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}
      {errorMessage && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Gunakan ikon <Pencil className="inline size-3.5 align-text-bottom" aria-hidden="true" /> untuk
        menyunting registrasi pasien dan ikon{' '}
        <Trash className="inline size-3.5 align-text-bottom" aria-hidden="true" /> untuk menghapus data.
        Setiap penghapusan membutuhkan konfirmasi.
      </p>

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
        busyId={busyId}
        onCall={handleCallPatient}
        onServe={handleServe}
        onFinish={handleFinish}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onEscalate={handleEscalate}
        onRecord={openRecordAction}
      />

      <QueueColumn
        priority="kuning"
        patients={byPriority('kuning')}
        busyId={busyId}
        onCall={handleCallPatient}
        onServe={handleServe}
        onFinish={handleFinish}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onEscalate={handleEscalate}
        onRecord={openRecordAction}
      />

      <QueueColumn
        priority="hijau"
        patients={byPriority('hijau')}
        busyId={busyId}
        onCall={handleCallPatient}
        onServe={handleServe}
        onFinish={handleFinish}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onEscalate={handleEscalate}
        onRecord={openRecordAction}
      />

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

      {deleteTarget && (
        <ConfirmDeleteDialog
          patient={deleteTarget}
          busy={deleteBusy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {actionTarget && (
        <RecordActionDialog
          patient={actionTarget}
          note={actionNote}
          busy={actionBusy}
          onChange={setActionNote}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleRecordAction}
        />
      )}
    </div>
  );
}
