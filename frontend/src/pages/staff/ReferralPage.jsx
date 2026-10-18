import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Ambulance,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Check,
  XCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import FormField from '../../components/common/FormField';
import ProgressBar from '../../components/common/ProgressBar';
import Avatar from '../../components/common/Avatar';
import PriorityBadge from '../../components/common/PriorityBadge';
import { buttonOutlineClass, buttonPrimaryClass, inputClass } from '../../utils/styles';
import {
  getFacilities,
  getReferrals,
  createReferral,
  updateReferral,
  updateReferralStatus,
} from '../../services/referralService';
import { getTriagePatients } from '../../services/triageService';

const REFERRAL_STEPS = [
  { key: 'Draf', label: '1. Verifikasi Kebutuhan' },
  { key: 'Menunggu konfirmasi', label: '2. Konfirmasi Penerima' },
  { key: 'Diterima', label: '3. Persiapan Ambulans' },
  { key: 'Dalam perjalanan', label: '4. Pengantaran' },
  { key: 'Serah terima selesai', label: '5. Serah Terima Selesai' },
];

const COORDINATION_NOTES = [
  [
    'SOP Rujukan Cepat',
    'Keputusan rujukan adalah keputusan klinis oleh dokter/tenaga medis triase. Pastikan stabilisasi ABC (Airway, Breathing, Circulation) telah dilakukan sebelum pasien diberangkatkan.',
  ],
  [
    'Status Diterima',
    'Status Diterima berarti faskes tujuan telah mengonfirmasi kesiapan bed/layanan dan dokter penerima. Pasien belum selesai dirujuk sampai dokumen serah terima ditandatangani.',
  ],
  [
    'Kebutuhan Pasien & Kesiapan Faskes',
    'Kesesuaian fasilitas tujuan (UGD/ICU/NICU/Cath Lab) lebih krusial daripada sekadar kapasitas total. Selalu konfirmasi kesiapan dokter spesialis penerima sebelum mengirim ambulans.',
  ],
];

const priorityCodeToColor = (code) => {
  if (code === 'P1' || code === 'merah') return 'merah';
  if (code === 'P2' || code === 'kuning') return 'kuning';
  return 'hijau';
};

const formatVitalsText = (vitals) => {
  if (!vitals || typeof vitals !== 'object') return 'Belum ada data tanda vital.';
  const parts = [];
  if (vitals.tekananDarah) parts.push(`TD: ${vitals.tekananDarah} mmHg`);
  if (vitals.detakJantung) parts.push(`HR: ${vitals.detakJantung} bpm`);
  if (vitals.lajuPernapasan) parts.push(`RR: ${vitals.lajuPernapasan} x/m`);
  if (vitals.saturasiOksigen) parts.push(`SpO2: ${vitals.saturasiOksigen}%`);
  if (vitals.suhu) parts.push(`Suhu: ${vitals.suhu} °C`);
  return parts.length > 0 ? parts.join(', ') : 'Belum diukur.';
};

const getStatusBadgeTone = (status) => {
  switch (status) {
    case 'Diterima':
    case 'ACCEPTED':
    case 'Serah terima selesai':
      return 'success';
    case 'Menunggu konfirmasi':
    case 'PENDING':
      return 'warning';
    case 'Dalam perjalanan':
      return 'info';
    case 'Ditolak':
    case 'REJECTED':
      return 'danger';
    case 'Draf':
    default:
      return 'neutral';
  }
};

const INITIAL_FORM = {
  triage_patient_id: '',
  facility_id: '',
  faskes_tujuan: '',
  alasan_rujukan: '',
  ringkasan_kondisi: '',
  tanda_vital_terakhir: '',
  tindakan_stabilisasi: '',
  kebutuhan_layanan: '',
  kesiapan_menerima: '',
  transportasi: 'Ambulans IGD (Lengkap alat resusitasi & Oksigen)',
  petugas_pengirim: 'dr. Faisal Rahman (Kepala Triase)',
  catatan_medis: '',
  catatan_serah_terima: '',
  status_rujukan: 'Menunggu konfirmasi',
};

export default function ReferralPage() {
  const [facilities, setFacilities] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mode: 'create' (buat rujukan baru) atau 'detail' (lihat/update rujukan riwayat)
  const [mode, setMode] = useState('create');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DONE'

  // Load data awal dari database
  const loadData = async () => {
    try {
      const [facData, refData, triageData] = await Promise.all([
        getFacilities(),
        getReferrals(),
        getTriagePatients({ verifikasi: 'all' }),
      ]);

      if (facData && facData.length > 0) {
        setFacilities(facData);
      }
      if (refData && refData.length > 0) {
        setReferrals(refData);
      }
      if (triageData?.patients) {
        setPatients(triageData.patients);
      }
      setIsLive(true);
    } catch (err) {
      console.warn('Gagal memuat data rujukan dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Defer ke tick berikutnya agar pemuatan awal tidak memicu setState sinkron di dalam effect.
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update form field
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Pilih pasien untuk rujukan baru
  const handleSelectPatient = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      setForm((prev) => ({
        ...prev,
        triage_patient_id: '',
        ringkasan_kondisi: '',
        tanda_vital_terakhir: '',
        alasan_rujukan: '',
      }));
      return;
    }

    const vitalsStr = formatVitalsText(patient.tanda_vital);
    const ringkasan = `Pasien ${patient.nama_pasien} (${patient.umur} ${patient.satuan_umur || 'tahun'}, ${
      patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'
    }). Keluhan utama: ${patient.keluhan_utama}. Prioritas triase: ${
      patient.prioritas_triage || 'P1'
    }${patient.skor_urgensi ? ` (Skor urgensi: ${patient.skor_urgensi})` : ''}. ${
      patient.analisis_ai || ''
    }`;

    setForm((prev) => ({
      ...prev,
      triage_patient_id: patient.id,
      ringkasan_kondisi: ringkasan,
      tanda_vital_terakhir: vitalsStr,
      alasan_rujukan:
        prev.alasan_rujukan ||
        `Perlu rujukan lanjutan untuk evaluasi & penanganan spesialis atas kondisi: ${patient.keluhan_utama}`,
    }));
  };

  // Klik faskes mitra di kolom kanan untuk memilih tujuan
  const handlePickFacility = (facility) => {
    setForm((prev) => ({
      ...prev,
      facility_id: facility.id,
      faskes_tujuan: facility.nama,
      kebutuhan_layanan: prev.kebutuhan_layanan || facility.layanan || '',
    }));
    setNotification({
      type: 'info',
      message: `Faskes tujuan diatur ke: ${facility.nama}`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Klik salah satu item di riwayat rujukan untuk melihat/mengedit
  const handleSelectReferralHistory = (ref) => {
    setSelectedReferral(ref);
    setMode('detail');
    setForm({
      triage_patient_id: ref.triage_patient_id,
      facility_id: ref.facility_id || '',
      faskes_tujuan: ref.faskes_tujuan || '',
      alasan_rujukan: ref.alasan_rujukan || '',
      ringkasan_kondisi: ref.ringkasan_kondisi || '',
      tanda_vital_terakhir:
        typeof ref.tanda_vital_terakhir === 'string'
          ? ref.tanda_vital_terakhir
          : formatVitalsText(ref.tanda_vital_terakhir || ref.patient?.tanda_vital),
      tindakan_stabilisasi: ref.tindakan_stabilisasi || '',
      kebutuhan_layanan: ref.kebutuhan_layanan || '',
      kesiapan_menerima: ref.kesiapan_menerima || '',
      transportasi: ref.transportasi || 'Ambulans Faskes',
      petugas_pengirim: ref.petugas_pengirim || 'dr. Faisal Rahman',
      catatan_medis: ref.catatan_medis || '',
      catatan_serah_terima: ref.catatan_serah_terima || '',
      status_rujukan: ref.status_rujukan || 'Menunggu konfirmasi',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mulai buat rujukan baru
  const handleStartCreateNew = () => {
    setSelectedReferral(null);
    setMode('create');
    setForm(INITIAL_FORM);
    setNotification(null);
  };

  // Simpan rujukan (Draf atau Ajukan)
  const handleSubmitReferral = async (targetStatus) => {
    if (!form.triage_patient_id) {
      setNotification({ type: 'error', message: 'Silakan pilih pasien triase terlebih dahulu.' });
      return;
    }
    if (!form.faskes_tujuan) {
      setNotification({ type: 'error', message: 'Silakan pilih atau isi faskes tujuan rujukan.' });
      return;
    }

    setSubmitting(true);
    setNotification(null);
    try {
      const payload = {
        ...form,
        status_rujukan: targetStatus,
      };

      if (mode === 'create') {
        const created = await createReferral(payload);
        setNotification({
          type: 'success',
          message: `Rujukan berhasil dibuat dengan status "${targetStatus}".`,
        });
        setSelectedReferral(created);
        setMode('detail');
      } else if (selectedReferral?.id) {
        const updated = await updateReferral(selectedReferral.id, payload);
        setNotification({
          type: 'success',
          message: `Data rujukan berhasil diperbarui (Status: ${targetStatus}).`,
        });
        setSelectedReferral(updated);
      }

      // Refresh list riwayat
      const updatedRefData = await getReferrals();
      if (updatedRefData) setReferrals(updatedRefData);
    } catch (err) {
      console.error('Gagal memproses rujukan:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal menyimpan data rujukan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update status rujukan cepat (Workflow button)
  const handleTransitionStatus = async (newStatus) => {
    if (!selectedReferral?.id) return;
    setSubmitting(true);
    setNotification(null);
    try {
      const updated = await updateReferralStatus(
        selectedReferral.id,
        newStatus,
        form.catatan_medis || form.catatan_serah_terima || undefined
      );
      setForm((prev) => ({ ...prev, status_rujukan: newStatus }));
      setSelectedReferral((prev) => ({ ...prev, status_rujukan: newStatus, ...updated }));
      setNotification({
        type: 'success',
        message: `Status rujukan berhasil diubah menjadi "${newStatus}".`,
      });

      const updatedRefData = await getReferrals();
      if (updatedRefData) setReferrals(updatedRefData);
    } catch (err) {
      console.error('Gagal memperbarui status rujukan:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal mengubah status rujukan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter riwayat rujukan
  const filteredReferrals = useMemo(() => {
    if (historyFilter === 'ACTIVE') {
      return referrals.filter(
        (r) =>
          r.status_rujukan === 'Draf' ||
          r.status_rujukan === 'Menunggu konfirmasi' ||
          r.status_rujukan === 'Diterima' ||
          r.status_rujukan === 'Dalam perjalanan' ||
          r.status_rujukan === 'PENDING'
      );
    }
    if (historyFilter === 'DONE') {
      return referrals.filter(
        (r) =>
          r.status_rujukan === 'Serah terima selesai' ||
          r.status_rujukan === 'Ditolak' ||
          r.status_rujukan === 'ACCEPTED' ||
          r.status_rujukan === 'REJECTED'
      );
    }
    return referrals;
  }, [referrals, historyFilter]);

  // Hitung tahap aktif di stepper (0-4)
  const currentStepIndex = useMemo(() => {
    const currentStatus = mode === 'detail' ? form.status_rujukan : 'Draf';
    const idx = REFERRAL_STEPS.findIndex((s) => s.key === currentStatus);
    return idx >= 0 ? idx : 0;
  }, [mode, form.status_rujukan]);

  // Pasien yang sedang aktif di form
  const activePatient = useMemo(() => {
    if (mode === 'detail' && selectedReferral?.patient) {
      return selectedReferral.patient;
    }
    return patients.find((p) => p.id === form.triage_patient_id) || null;
  }, [mode, selectedReferral, patients, form.triage_patient_id]);

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Rujukan Eksternal & Ambulans
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Koordinasi digital pengiriman pasien darurat antar fasilitas kesehatan mitra.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={handleStartCreateNew}
            className={`${buttonPrimaryClass} text-xs py-2`}
          >
            <PlusCircle className="size-4" />
            Buat Rujukan Baru
          </button>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {isLive ? 'Live Supabase DB' : 'Data Cadangan'}
          </span>
        </div>
      </div>

      {/* ── Alert Notifikasi ── */}
      {notification && (
        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            notification.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : notification.type === 'info'
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'error' ? (
              <AlertCircle className="size-5 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
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

      {/* ── Stepper Tahapan Rujukan ── */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tahapan Alur Rujukan Pasien
          </p>
          <span className="text-xs text-slate-400">
            {mode === 'detail'
              ? `Status: ${form.status_rujukan}`
              : 'Mode: Pendaftaran Rujukan Baru'}
          </span>
        </div>
        <ol className="mt-3 flex flex-wrap gap-2" aria-label="Tahap rujukan">
          {REFERRAL_STEPS.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            return (
              <li
                key={step.key}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  form.status_rujukan === 'Ditolak'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : isCurrent
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs ring-2 ring-brand-100'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {isCompleted && <Check className="size-3.5 text-emerald-600" />}
                {isCurrent && <Clock className="size-3.5 text-brand-600" />}
                {step.label}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        {/* ── Kolom Kiri (Formulir & Detail Pasien) ── */}
        <div className="space-y-6 xl:col-span-3">
          {/* Card Pasien & Faskes */}
          <Card
            title={mode === 'create' ? '1. Pilih Pasien & Tujuan Rujukan' : 'Informasi Pasien Rujukan'}
            subtitle={
              mode === 'create'
                ? 'Pilih pasien triase yang memerlukan perawatan lanjutan di fasilitas mitra.'
                : 'Data rujukan aktif yang tersimpan dalam sistem koordinasi.'
            }
          >
            {mode === 'create' ? (
              <div className="space-y-4">
                <FormField label="Pilih Pasien Triase" htmlFor="select-patient" tag="Wajib">
                  <select
                    id="select-patient"
                    value={form.triage_patient_id}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    className={inputClass()}
                  >
                    <option value="">-- Pilih pasien dari antrean triase --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_pasien} ({p.umur} {p.satuan_umur || 'th'}) • {p.prioritas_triage || 'P1'} • {p.keluhan_utama.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </FormField>

                {activePatient && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={activePatient.nama_pasien} size="lg" className="rounded-xl" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-slate-900">{activePatient.nama_pasien}</p>
                          <PriorityBadge priority={priorityCodeToColor(activePatient.prioritas_triage)} />
                        </div>
                        <p className="text-xs text-slate-500">
                          {activePatient.umur} {activePatient.satuan_umur || 'tahun'} •{' '}
                          {activePatient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • NIK:{' '}
                          {activePatient.nik || 'Tidak ada'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          Keluhan: {activePatient.keluhan_utama}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge tone={getStatusBadgeTone(form.status_rujukan)}>
                    Status: {form.status_rujukan}
                  </Badge>
                  <button
                    type="button"
                    onClick={handleStartCreateNew}
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    + Buat Rujukan Baru
                  </button>
                </div>
                {activePatient && (
                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <Avatar name={activePatient.nama_pasien} size="lg" className="rounded-xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-slate-900">{activePatient.nama_pasien}</p>
                        <PriorityBadge priority={priorityCodeToColor(activePatient.prioritas_triage)} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {activePatient.umur} {activePatient.satuan_umur || 'th'} •{' '}
                        {activePatient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-700">
                        {activePatient.keluhan_utama}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pilihan Faskes Tujuan */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Faskes Tujuan Rujukan" htmlFor="faskes_tujuan" tag="Wajib">
                <select
                  id="faskes_tujuan"
                  value={form.faskes_tujuan}
                  onChange={(e) => {
                    const selectedFac = facilities.find((f) => f.nama === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      faskes_tujuan: e.target.value,
                      facility_id: selectedFac ? selectedFac.id : '',
                    }));
                  }}
                  className={inputClass()}
                >
                  <option value="">-- Pilih Fasilitas Mitra --</option>
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.nama}>
                      {fac.nama} ({fac.jarak_km} km • Okupansi {fac.kapasitas_persen}%)
                    </option>
                  ))}
                  <option value="Faskes Lainnya">Faskes Lainnya / Di Luar Jaringan</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Tip: Anda juga dapat mengklik langsung kartu faskes di kolom kanan.
                </p>
              </FormField>

              <FormField label="Dokter / Petugas Pengirim" htmlFor="petugas_pengirim">
                <input
                  id="petugas_pengirim"
                  type="text"
                  value={form.petugas_pengirim}
                  onChange={(e) => handleChange('petugas_pengirim', e.target.value)}
                  className={inputClass()}
                  placeholder="Nama dokter / kepala triase"
                />
              </FormField>
            </div>
          </Card>

          {/* Card Form Rujukan Digital Lengkap */}
          <Card
            title="Formulir Koordinasi Rujukan Digital"
            subtitle="Data klinis pasien untuk koordinasi antar fasilitas mitra guna persiapan tindakan dan penerimaan pasien."
          >
            <div className="space-y-4">
              <FormField label="Alasan / Indikasi Utama Rujukan" htmlFor="alasan_rujukan" tag="Wajib">
                <input
                  id="alasan_rujukan"
                  type="text"
                  value={form.alasan_rujukan}
                  onChange={(e) => handleChange('alasan_rujukan', e.target.value)}
                  className={inputClass()}
                  placeholder="Contoh: Suspek STEMI akut, butuh penanganan cath lab segera"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Ringkasan Kondisi Pasien" htmlFor="ringkasan_kondisi">
                  <textarea
                    id="ringkasan_kondisi"
                    rows={4}
                    value={form.ringkasan_kondisi}
                    onChange={(e) => handleChange('ringkasan_kondisi', e.target.value)}
                    className={`${inputClass()} resize-none text-xs leading-relaxed`}
                    placeholder="Riwayat keluhan dan asesmen awal tenaga medis..."
                  />
                </FormField>

                <FormField label="Tanda Vital Terakhir" htmlFor="tanda_vital_terakhir">
                  <textarea
                    id="tanda_vital_terakhir"
                    rows={4}
                    value={form.tanda_vital_terakhir}
                    onChange={(e) => handleChange('tanda_vital_terakhir', e.target.value)}
                    className={`${inputClass()} resize-none text-xs leading-relaxed`}
                    placeholder="Nilai TD, Nadi, RR, SpO2, Suhu, GCS..."
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Tindakan Awal / Terapi Stabilisasi" htmlFor="tindakan_stabilisasi">
                  <textarea
                    id="tindakan_stabilisasi"
                    rows={3}
                    value={form.tindakan_stabilisasi}
                    onChange={(e) => handleChange('tindakan_stabilisasi', e.target.value)}
                    className={`${inputClass()} resize-none text-xs`}
                    placeholder="O2 nasal, jalur IV, obat yang telah diberikan..."
                  />
                </FormField>

                <FormField label="Kebutuhan Layanan Spesifik" htmlFor="kebutuhan_layanan">
                  <textarea
                    id="kebutuhan_layanan"
                    rows={3}
                    value={form.kebutuhan_layanan}
                    onChange={(e) => handleChange('kebutuhan_layanan', e.target.value)}
                    className={`${inputClass()} resize-none text-xs`}
                    placeholder="Contoh: Rawat Inap ICU, Dokter Spesialis Bedah, Cath Lab..."
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Transportasi & Pendamping" htmlFor="transportasi">
                  <input
                    id="transportasi"
                    type="text"
                    value={form.transportasi}
                    onChange={(e) => handleChange('transportasi', e.target.value)}
                    className={inputClass()}
                    placeholder="Ambulans Gawat Darurat • 1 Dokter & 1 Perawat"
                  />
                </FormField>

                <FormField label="Konfirmasi Kesiapan Penerima" htmlFor="kesiapan_menerima">
                  <input
                    id="kesiapan_menerima"
                    type="text"
                    value={form.kesiapan_menerima}
                    onChange={(e) => handleChange('kesiapan_menerima', e.target.value)}
                    className={inputClass()}
                    placeholder="Nama dokter/petugas faskes tujuan & jam konfirmasi"
                  />
                </FormField>
              </div>

              <FormField label="Catatan Tambahan / Serah Terima Faskes" htmlFor="catatan_serah_terima">
                <textarea
                  id="catatan_serah_terima"
                  rows={2}
                  value={form.catatan_serah_terima}
                  onChange={(e) => handleChange('catatan_serah_terima', e.target.value)}
                  className={`${inputClass()} resize-none text-xs`}
                  placeholder="Catatan saat serah terima di faskes tujuan (kondisi tiba, dokumen rekammedis yang diserahkan)..."
                />
              </FormField>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-5">
                {mode === 'create' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitReferral('Draf')}
                      className={buttonOutlineClass}
                    >
                      <FileText className="size-4 text-slate-500" />
                      Simpan Sebagai Draf
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !form.triage_patient_id || !form.faskes_tujuan}
                      onClick={() => handleSubmitReferral('Menunggu konfirmasi')}
                      className={buttonPrimaryClass}
                    >
                      <Send className="size-4" />
                      {submitting ? 'Memproses...' : 'Ajukan Koordinasi Rujukan'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Alur transisi status cepat */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-900">
                        Progres & Tindakan Alur Rujukan:
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form.status_rujukan === 'Draf' && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleTransitionStatus('Menunggu konfirmasi')}
                            className={`${buttonPrimaryClass} text-xs py-2`}
                          >
                            <Send className="size-3.5" />
                            Kirim Permintaan Konfirmasi
                          </button>
                        )}

                        {form.status_rujukan === 'Menunggu konfirmasi' && (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleTransitionStatus('Diterima')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Faskes Mengonfirmasi Diterima
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleTransitionStatus('Ditolak')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                            >
                              <XCircle className="size-3.5" />
                              Tolak Rujukan
                            </button>
                          </>
                        )}

                        {form.status_rujukan === 'Diterima' && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleTransitionStatus('Dalam perjalanan')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
                          >
                            <Ambulance className="size-3.5" />
                            Ambulans Berangkat (Dalam Perjalanan)
                          </button>
                        )}

                        {form.status_rujukan === 'Dalam perjalanan' && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleTransitionStatus('Serah terima selesai')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            <UserCheck className="size-3.5" />
                            Selesaikan Serah Terima di Faskes Tujuan
                          </button>
                        )}

                        {form.status_rujukan === 'Serah terima selesai' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-4" />
                            Rujukan ini telah selesai dan serah terima tuntas.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleStartCreateNew}
                        className={buttonOutlineClass}
                      >
                        <PlusCircle className="size-4 text-slate-500" />
                        Buat Rujukan Baru Lainnya
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmitReferral(form.status_rujukan)}
                        className={buttonPrimaryClass}
                      >
                        <Check className="size-4" />
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan Catatan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Kolom Kanan (Faskes Mitra & Riwayat) ── */}
        <div className="space-y-6 xl:col-span-2">
          {/* Kapasitas Faskes Mitra */}
          <Card
            title="Kapasitas Faskes Mitra"
            subtitle="Klik pada salah satu faskes untuk memilihnya langsung sebagai tujuan rujukan."
          >
            <div className="space-y-3">
              {facilities.map((facility) => {
                const isSelected = form.faskes_tujuan === facility.nama;
                return (
                  <button
                    key={facility.id || facility.nama}
                    type="button"
                    onClick={() => handlePickFacility(facility)}
                    className={`block w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-200'
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-500" />
                          <p className="text-sm font-bold text-slate-900">{facility.nama}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Jarak: {facility.jarak_km} km • Layanan: {facility.layanan}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${facility.text_class || 'text-slate-700'}`}>
                        {facility.kapasitas_persen}%
                      </span>
                    </div>
                    <ProgressBar
                      value={facility.kapasitas_persen}
                      barClass={facility.tone || 'bg-emerald-500'}
                      className="mt-2"
                    />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Riwayat Rujukan Terkini */}
          <Card
            title="Riwayat Rujukan Terkini"
            subtitle="Klik pasien rujukan untuk meninjau detail dan memperbarui statusnya."
          >
            {/* Filter tab */}
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
              {[
                ['ALL', 'Semua'],
                ['ACTIVE', 'Aktif'],
                ['DONE', 'Selesai'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryFilter(key)}
                  className={`flex-1 rounded-md py-1 font-semibold transition ${
                    historyFilter === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredReferrals.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Belum ada data rujukan pada kategori ini.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {filteredReferrals.map((item) => {
                  const isSelected = selectedReferral?.id === item.id;
                  const tgl = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectReferralHistory(item)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-300'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.patient?.nama_pasien || 'Pasien Rujukan'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Tujuan: <span className="font-semibold">{item.faskes_tujuan}</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{tgl}</p>
                          </div>
                          <Badge tone={getStatusBadgeTone(item.status_rujukan)}>
                            {item.status_rujukan}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Catatan Koordinasi & SOP */}
          <Card title="Catatan SOP Koordinasi Rujukan">
            <div className="space-y-3">
              {COORDINATION_NOTES.map(([title, text]) => (
                <div key={title} className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
