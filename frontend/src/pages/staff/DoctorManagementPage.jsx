import { useState, useEffect } from 'react';
import {
  UserPlus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Users,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { buttonOutlineClass, buttonPrimaryClass, inputClass } from '../../utils/styles';
import {
  getDoctors,
  getNurses,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
} from '../../services/doctorService';

const STATUS_STYLE = {
  Tersedia: 'bg-emerald-500',
  Istirahat: 'bg-amber-500',
  Sibuk: 'bg-red-500',
  OFF: 'bg-slate-400',
};

function StatusDot({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
      <span className={`size-2 rounded-full ${STATUS_STYLE[status] || 'bg-slate-400'}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Tambah Petugas Baru
  const [addForm, setAddForm] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'DOKTER',
    spesialisasi: 'Dokter Umum',
    layanan: 'Layanan FKTP & Triase',
    kompetensi: 'FKTP & Triase',
    status: 'Tersedia',
    jadwal: '08:00–14:00',
    hari: 'Senin–Jumat',
    jalur: 'Umum',
  });

  // Form Edit Jadwal Petugas Terpilih
  const [scheduleForm, setScheduleForm] = useState({
    spesialisasi: '',
    layanan: '',
    kompetensi: '',
    jadwal: '',
    hari: '',
    jalur: '',
  });

  // Load Data Dokter & Perawat dari DB
  const loadData = async () => {
    try {
      const [doctorData, nurseData] = await Promise.all([getDoctors(), getNurses()]);

      if (doctorData && doctorData.length > 0) {
        setDoctors(doctorData);
        setSelectedId((prev) =>
          !prev || !doctorData.some((d) => d.id === prev) ? doctorData[0].id : prev,
        );
      }
      if (nurseData) {
        setNurses(nurseData);
      }
      setIsLive(true);
    } catch (err) {
      console.warn('Gagal memuat petugas dari database:', err);
      setNotification({
        type: 'error',
        message: 'Gagal memuat data dari server, silakan periksa koneksi backend.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Defer ke tick berikutnya agar pemuatan awal tidak memicu setState sinkron di dalam effect.
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  const allStaff = [...doctors, ...nurses];
  const selected = allStaff.find((staff) => staff.id === selectedId) || doctors[0] || nurses[0] || null;

  // Ubah Status Dokter atau Perawat (Tersedia, Istirahat, Sibuk, OFF)
  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    try {
      await updateDoctorStatus(selected.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === selected.id ? { ...d, status: newStatus } : d))
      );
      setNurses((prev) =>
        prev.map((n) => (n.id === selected.id ? { ...n, status: newStatus } : n))
      );
      setNotification({
        type: 'success',
        message: `Status ${selected.nama} diperbarui menjadi "${newStatus}".`,
      });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Gagal memperbarui status petugas:', err);
      setNotification({
        type: 'error',
        message: 'Gagal memperbarui status petugas.',
      });
    }
  };

  // Buka Modal Atur Jadwal
  const handleOpenScheduleModal = () => {
    if (!selected) return;
    setScheduleForm({
      spesialisasi: selected.spesialisasi || (selected.role === 'PERAWAT' ? 'Perawat Triase' : 'Dokter Umum'),
      layanan: selected.layanan || 'Layanan FKTP & Triase',
      kompetensi: selected.kompetensi || 'FKTP & Triase',
      jadwal: selected.jadwal || '08:00–14:00',
      hari: selected.hari || 'Senin–Jumat',
      jalur: selected.jalur || (selected.role === 'PERAWAT' ? 'Triase & Registrasi' : 'Umum'),
    });
    setIsScheduleModalOpen(true);
  };

  // Submit Edit Jadwal
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const updated = await updateDoctor(selected.id, scheduleForm);
      setDoctors((prev) =>
        prev.map((d) => (d.id === selected.id ? { ...d, ...updated } : d))
      );
      setNurses((prev) =>
        prev.map((n) => (n.id === selected.id ? { ...n, ...updated } : n))
      );
      setIsScheduleModalOpen(false);
      setNotification({
        type: 'success',
        message: `Jadwal & penugasan ${selected.nama} berhasil diperbarui.`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Gagal menyimpan jadwal petugas:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal menyimpan perubahan jadwal.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Tambah Petugas Baru
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!addForm.nama || !addForm.email) {
      setNotification({ type: 'error', message: 'Nama dan email wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPetugas = await createDoctor(addForm);
      if (newPetugas.role === 'PERAWAT') {
        setNurses((prev) => [...prev, newPetugas]);
      } else {
        setDoctors((prev) => [...prev, newPetugas]);
        setSelectedId(newPetugas.id);
      }

      setIsAddModalOpen(false);
      setAddForm({
        nama: '',
        email: '',
        password: '',
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Layanan FKTP & Triase',
        kompetensi: 'FKTP & Triase',
        status: 'Tersedia',
        jadwal: '08:00–14:00',
        hari: 'Senin–Jumat',
        jalur: 'Umum',
      });
      setNotification({
        type: 'success',
        message: `${newPetugas.role === 'PERAWAT' ? 'Perawat' : 'Dokter'} ${newPetugas.nama} berhasil ditambahkan!`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Gagal menambahkan petugas baru:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal menambahkan petugas baru.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              FKTP Puskesmas Medan Selayang
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Data operasional triase, jadwal pelayanan poli, dan penugasan dokter/perawat.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadData();
            }}
            disabled={isLoading}
            className={`${buttonOutlineClass} text-xs py-2`}
            title="Refresh data dari database"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenScheduleModal}
            disabled={!selected}
            className={`${buttonOutlineClass} text-xs py-2`}
          >
            <Calendar className="size-3.5 text-slate-600" />
            Atur Jadwal Kerja
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={`${buttonPrimaryClass} text-xs py-2`}
          >
            <UserPlus className="size-4" />
            Tambah Petugas
          </button>
        </div>
      </div>

      {/* ── Alert Notifikasi ── */}
      {notification && (
        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-sm ${
            notification.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ── Konten Utama ── */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Kolom Kiri: Daftar Dokter & Perawat */}
        <div className="space-y-6 xl:col-span-2">
          {/* Grid Dokter */}
          <div className="grid gap-4 sm:grid-cols-2">
            {doctors.map((doctor) => {
              const active = doctor.id === selectedId;
              return (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setSelectedId(doctor.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-xs transition hover:border-brand-400 ${
                    active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3.5">
                    <Avatar name={doctor.nama} size="lg" className="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-900">{doctor.nama}</h3>
                      <p className="truncate text-xs text-slate-500">
                        {doctor.spesialisasi} • {doctor.layanan}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <StatusDot status={doctor.status} />
                    {doctor.active_patient_count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        <Users className="size-3" />
                        {doctor.active_patient_count} Pasien Antre
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tidak ada antrean</span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-50 pt-2 text-right text-xs text-slate-400">
                    <p>Jadwal: {doctor.jadwal} ({doctor.hari})</p>
                    <p>Jalur: <span className="font-semibold text-slate-600">{doctor.jalur}</span></p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Card Perawat Triase & Tenaga Medis (Dinamis dari Database, Bisa Dipilih) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Perawat Triase & Tenaga Medis ({nurses.length} Terdaftar)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Klik petugas untuk memilih & atur status</span>
            </div>

            {nurses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                Belum ada perawat terdaftar di sistem. Klik "+ Tambah Petugas" untuk mendaftarkan perawat.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {nurses.map((nurse) => {
                  const active = nurse.id === selectedId;
                  return (
                    <button
                      key={nurse.id}
                      type="button"
                      onClick={() => setSelectedId(nurse.id)}
                      aria-pressed={active}
                      className={`rounded-2xl border bg-white p-5 text-left shadow-xs transition hover:border-brand-400 ${
                        active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3.5">
                        <Avatar name={nurse.nama} size="lg" className="rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-slate-900">{nurse.nama}</h3>
                          <p className="truncate text-xs text-slate-500">
                            {nurse.spesialisasi || 'Perawat Triase'} • {nurse.layanan || 'Triase & Registrasi'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between gap-2">
                        <StatusDot status={nurse.status || 'Tersedia'} />
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                          {nurse.email}
                        </span>
                      </div>

                      <div className="mt-3 border-t border-slate-50 pt-2 text-right text-xs text-slate-400">
                        <p>Jadwal: {nurse.jadwal || '08:00–14:00'} ({nurse.hari || 'Senin–Jumat'})</p>
                        <p>Tugas: <span className="font-semibold text-slate-600">{nurse.jalur || 'Triase & Registrasi'}</span></p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail Profil Petugas Terpilih */}
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          {selected ? (
            <>
              <div className="flex flex-col items-center text-center">
                <Avatar name={selected.nama} size="xl" className="rounded-2xl shadow-xs" />
                <h3 className="mt-3.5 text-lg font-bold text-slate-900">{selected.nama}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selected.spesialisasi || (selected.role === 'PERAWAT' ? 'Perawat Triase' : 'Dokter')} • {selected.layanan}
                </p>
                <div className="mt-3">
                  <StatusDot status={selected.status || 'Tersedia'} />
                </div>

                {/* Tombol Ganti Status Cepat */}
                <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
                  {['Tersedia', 'Istirahat', 'Sibuk', 'OFF'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        selected.status === st
                          ? 'bg-brand-700 text-white shadow-xs ring-2 ring-brand-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ringkasan Beban Antrean / Penugasan */}
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    {selected.role === 'PERAWAT' ? 'Tugas Utama' : 'Beban Antrean Saat Ini'}
                  </span>
                  <span className="font-bold text-brand-700">
                    {selected.role === 'PERAWAT' ? 'Registrasi & Triase' : `${selected.active_patient_count || 0} Pasien`}
                  </span>
                </div>
                {selected.role !== 'PERAWAT' ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-white p-2 text-center border border-slate-100">
                      <p className="text-slate-400">Sedang Diperiksa</p>
                      <p className="font-bold text-slate-800">{selected.serving_count || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 text-center border border-slate-100">
                      <p className="text-slate-400">Menunggu Dipanggil</p>
                      <p className="font-bold text-slate-800">{selected.waiting_count || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg bg-white p-2 text-center border border-slate-100 text-[11px]">
                    <p className="text-slate-400">Penugasan Medis</p>
                    <p className="font-bold text-slate-800">Verifikasi Triase & Asesmen Awal Pasien</p>
                  </div>
                )}
              </div>

              {/* Profil Operasional */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Profil Operasional
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400">Peran</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900">{selected.role || 'DOKTER'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400">Kompetensi</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900">{selected.kompetensi || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Jadwal & Penugasan */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Jadwal & Penugasan
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenScheduleModal}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                  >
                    <Edit3 className="size-3" />
                    Ubah
                  </button>
                </div>
                <ul className="mt-2.5 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-brand-600" />
                    <span>{selected.hari}: <strong>{selected.jadwal}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="size-3.5 text-brand-600" />
                    <span>Jalur Pelayanan: <strong className="text-brand-800">{selected.jalur}</strong></span>
                  </li>
                </ul>
              </div>

              {/* Informasi Akun */}
              <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Email Akun:</p>
                <p className="font-mono text-[11px] text-slate-600">{selected.email}</p>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-xs text-slate-400">Pilih dokter untuk melihat detail.</p>
          )}
        </aside>
      </div>

      {/* ── MODAL 1: Tambah Petugas Baru ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">Tambah Dokter / Petugas Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="mt-4 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: dr. Amanda Putri"
                    value={addForm.nama}
                    onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="amanda@selayangpuskesmas.go.id"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Peran Petugas</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="DOKTER">DOKTER</option>
                    <option value="PERAWAT">PERAWAT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Password Awal</label>
                  <input
                    type="password"
                    placeholder="Default: Petugas123!"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Spesialisasi / Jabatan</label>
                  <input
                    type="text"
                    placeholder="Dokter Umum / Dokter Gigi / Perawat Triase"
                    value={addForm.spesialisasi}
                    onChange={(e) => setAddForm({ ...addForm, spesialisasi: e.target.value })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Layanan Poli</label>
                  <input
                    type="text"
                    placeholder="Layanan FKTP & Triase"
                    value={addForm.layanan}
                    onChange={(e) => setAddForm({ ...addForm, layanan: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Hari Kerja</label>
                  <input
                    type="text"
                    placeholder="Senin–Jumat"
                    value={addForm.hari}
                    onChange={(e) => setAddForm({ ...addForm, hari: e.target.value })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Jam Jadwal Praktik</label>
                  <input
                    type="text"
                    placeholder="08:00–14:00"
                    value={addForm.jadwal}
                    onChange={(e) => setAddForm({ ...addForm, jadwal: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Jalur Pelayanan Antrean</label>
                <input
                  type="text"
                  placeholder="Umum / Triase 1 / Anak / Gigi"
                  value={addForm.jalur}
                  onChange={(e) => setAddForm({ ...addForm, jalur: e.target.value })}
                  className={inputClass()}
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={buttonOutlineClass}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonPrimaryClass}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Atur Jadwal Kerja Dokter Terpilih ── */}
      {isScheduleModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Atur Jadwal: {selected.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">Hari Praktik Kerja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Senin–Jumat"
                  value={scheduleForm.hari}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, hari: e.target.value })}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Jam Jadwal Praktik</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08:00–14:00 atau 13:00–18:00"
                  value={scheduleForm.jadwal}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, jadwal: e.target.value })}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Jalur Pelayanan Antrean</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Triase Utama / Pemeriksaan umum / Anak"
                  value={scheduleForm.jalur}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, jalur: e.target.value })}
                  className={inputClass()}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Spesialisasi</label>
                  <input
                    type="text"
                    value={scheduleForm.spesialisasi}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, spesialisasi: e.target.value })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Layanan</label>
                  <input
                    type="text"
                    value={scheduleForm.layanan}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, layanan: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className={buttonOutlineClass}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonPrimaryClass}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
