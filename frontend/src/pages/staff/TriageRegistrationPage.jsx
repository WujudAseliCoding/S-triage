import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import FormField from '../../components/common/FormField';
import PriorityBadge from '../../components/common/PriorityBadge';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { buttonOutlineClass, buttonPrimaryClass, inputClass } from '../../utils/styles';
import {
  registerTriagePatient,
  getTriagePatientById,
  updateTriagePatient,
} from '../../services/triageService';

const COMPLETENESS = [
  ['Identitas kunjungan / no. rekam medis', 'BELUM TERTAUT'],
  ['Pencocokan duplikasi', 'BELUM DIPERIKSA'],
  ['Waktu datang', 'BELUM TERCATAT'],
  ['Sumber data', 'BELUM TERCATAT'],
];

const FINAL_CHECKS = [
  ['Prioritas dipilih petugas', 'BELUM DIPILIH'],
  ['Identitas verifikator', 'BELUM DITUGASKAN'],
  ['Waktu verifikasi', 'BELUM ADA'],
  ['Alasan override', 'WAJIB BILA BERUBAH'],
  ['Terakhir / jadwal penilaian ulang', 'BELUM ADA • SOP'],
  ['Eskalasi kondisi memburuk', 'SEGERA PANGGIL PETUGAS'],
];

const VITAL_FIELDS = [
  ['tekanan_darah', 'Tekanan darah (mmHg)', 'Belum diukur'],
  ['nadi', 'Nadi (kali/menit)', 'Belum diukur'],
  ['frekuensi_napas', 'Frekuensi napas (kali/menit)', 'Belum diukur'],
  ['spo2', 'SpO2 (%)', 'Belum diukur'],
  ['suhu', 'Suhu (°C)', 'Belum diukur'],
  ['kesadaran', 'Kesadaran', 'Belum dinilai'],
];

const ASSESSMENT_FIELDS = [
  ['nyeri', 'Nyeri', 'Belum dinilai'],
  ['alergi', 'Alergi obat', 'Belum diketahui'],
  ['faktor', 'Faktor relevan (kehamilan/anak)', 'Belum diketahui'],
  ['bahaya', 'Tanda bahaya', 'Belum dinilai'],
  ['riwayat', 'Riwayat penyakit', 'Belum lengkap'],
];

// Pemetaan kode prioritas ke label & badge
const PRIORITY_INFO = {
  P1: { badge: 'merah', text: 'P1 — Merah (Segera)' },
  P2: { badge: 'kuning', text: 'P2 — Kuning (Mendesak)' },
  P3: { badge: 'hijau', text: 'P3 — Hijau (Tidak Mendesak)' },
  P0: { badge: 'hitam', text: 'P0 — Hitam (Ekspektan)' },
};

function StatusTag({ children }) {
  return (
    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-600">
      {children}
    </span>
  );
}

function ChecklistRow({ label, status }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>{label}</span>
      <StatusTag>{status}</StatusTag>
    </div>
  );
}

const EMPTY_FORM = {
  nama: '',
  umur: '',
  jenis_kelamin: 'L',
  keluhan: '',
  catatan: '',
  vital: {},
  assessment: {},
};

export default function TriageRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPatient, setIsLoadingPatient] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Mode edit: muat data pasien dari database lalu isi formulir
  useEffect(() => {
    if (!editId) return undefined;
    let isActive = true;
    getTriagePatientById(editId)
      .then((patient) => {
        if (!isActive) return;
        if (!patient) {
          setLoadError('Data pasien tidak ditemukan.');
          return;
        }
        setForm({
          nama: patient.nama_pasien || '',
          umur: patient.umur != null ? String(patient.umur) : '',
          jenis_kelamin: patient.jenis_kelamin || 'L',
          keluhan: patient.keluhan_utama || '',
          catatan: patient.catatan_petugas || '',
          vital: patient.tanda_vital || {},
          assessment: {},
        });
      })
      .catch(() => {
        if (isActive) {
          setLoadError('Gagal memuat data pasien. Pastikan backend aktif lalu coba lagi.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingPatient(false);
      });
    return () => {
      isActive = false;
    };
  }, [editId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setVital = (key, value) =>
    setForm((prev) => ({ ...prev, vital: { ...prev.vital, [key]: value } }));
  const setAssessment = (key, value) =>
    setForm((prev) => ({ ...prev, assessment: { ...prev.assessment, [key]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nama.trim() || !form.keluhan.trim()) {
      setError('Nama pasien dan keluhan utama wajib diisi.');
      return;
    }
    const umurNum = parseInt(form.umur, 10) || 25;
    setIsSubmitting(true);
    try {
      const payload = {
        nama_pasien: form.nama.trim(),
        umur: umurNum,
        jenis_kelamin: form.jenis_kelamin,
        keluhan_utama: form.keluhan.trim(),
        tanda_vital: form.vital,
        catatan_petugas: form.catatan,
      };
      const res = isEdit
        ? await updateTriagePatient(editId, payload)
        : await registerTriagePatient(payload);
      setResult(res);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? err.response.data.errors.map((e) => e.message).join(', ')
          : null) ||
        (isEdit
          ? 'Gagal memperbarui data pasien. Pastikan backend aktif dan coba lagi.'
          : 'Gagal mendaftarkan pasien. Pastikan backend aktif dan coba lagi.');
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setForm(EMPTY_FORM);
  };

  const handleBackToQueue = () => {
    navigate('/antrean-live');
  };

  // ── Memuat data pasien (mode edit) ──
  if (isEdit && isLoadingPatient) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Memuat data pasien...">
          <p className="text-sm text-slate-500">Mengambil data registrasi dari database.</p>
        </Card>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Data tidak dapat dimuat">
          <div className="rounded-lg bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700" role="alert">
            {loadError}
          </div>
          <button type="button" onClick={handleBackToQueue} className={`${buttonPrimaryClass} mt-4`}>
            Kembali ke Antrean Live
          </button>
        </Card>
      </div>
    );
  }

  // ── Tampilan sukses setelah pendaftaran berhasil ──
  if (result) {
    const priorityKey = result.patient?.prioritas_triage || 'P3';
    const priorityInfo = PRIORITY_INFO[priorityKey] || PRIORITY_INFO.P3;
    return (
      <div className="mx-auto max-w-2xl">
        <Card title={isEdit ? '✅ Perubahan Data Pasien Tersimpan' : '✅ Pasien Berhasil Didaftarkan'}>
          <div className="space-y-4">
            {result.queue?.nomor_antrean && (
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">Nomor Antrean</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight text-emerald-700">
                  {result.queue.nomor_antrean}
                </p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Nama Pasien</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{result.patient?.nama_pasien}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Prioritas Triase (Rekomendasi AI)</p>
                <div className="mt-1.5">
                  <PriorityBadge priority={priorityInfo.badge} withDescription />
                </div>
              </div>
              {result.patient?.skor_urgensi != null && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Skor Urgensi AI</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{result.patient.skor_urgensi}</p>
                </div>
              )}
              {result.queue?.status && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Status Antrean</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{result.queue.status}</p>
                </div>
              )}
            </div>
            {result.patient?.analisis_ai && (
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                <p className="text-xs font-bold text-brand-800">
                  Analisis AI — belum terverifikasi klinis
                </p>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{result.patient.analisis_ai}</p>
                <p className="mt-2 text-[11px] text-brand-600">
                  Prioritas akhir ditetapkan petugas klinis. AI hanya memberikan rekomendasi awal.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleBackToQueue} className={buttonPrimaryClass}>
                Kembali ke Antrean Live
              </button>
              {!isEdit && (
                <button type="button" onClick={handleReset} className={buttonOutlineClass}>
                  + Daftarkan Pasien Baru
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Formulir pendaftaran ──
  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-5">
      {isEdit && (
        <div className="xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-brand-800">Mode edit registrasi pasien</p>
                <p className="text-xs text-brand-700">
                  Perubahan akan memperbarui data pasien di database. Nomor antrean tetap selama prioritas tidak diubah.
                </p>
              </div>
            </div>
            <button type="button" onClick={handleBackToQueue} className={buttonOutlineClass}>
              Batal &amp; kembali
            </button>
          </div>
        </div>
      )}
      <div className="space-y-6 xl:col-span-3">
        <Card
          title="Data dari pasien — belum diverifikasi"
          subtitle="Informasi ini diberikan oleh pasien atau keluarga. Belum diverifikasi petugas dan belum dicocokkan dengan rekam medis."
        >
          <p className="mb-3 text-xs font-semibold text-slate-700">Identitas pasien</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama / identitas sementara" htmlFor="nama" className="text-xs">
              <input
                id="nama"
                value={form.nama}
                onChange={(e) => setField('nama', e.target.value)}
                placeholder="Nama lengkap pasien"
                className={inputClass()}
                required
              />
            </FormField>
            <FormField label="Umur (tahun)" htmlFor="umur">
              <input
                id="umur"
                type="text"
                inputMode="numeric"
                value={form.umur}
                onChange={(e) => setField('umur', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Contoh: 35"
                className={inputClass()}
              />
            </FormField>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-700">Jenis kelamin</p>
            <div className="flex gap-4">
              {[
                ['L', 'Laki-laki'],
                ['P', 'Perempuan'],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="jenis_kelamin"
                    value={val}
                    checked={form.jenis_kelamin === val}
                    onChange={() => setField('jenis_kelamin', val)}
                    className="size-4 accent-brand-700"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <FormField label="Keluhan utama" htmlFor="keluhan" className="mt-5">
            <textarea
              id="keluhan"
              rows={4}
              value={form.keluhan}
              onChange={(e) => setField('keluhan', e.target.value)}
              placeholder="Pasien mengeluh demam tinggi sejak 3 hari, disertai batuk kering dan sesak napas..."
              className={`${inputClass()} resize-none border-brand-300 bg-brand-50/60`}
              required
            />
          </FormField>
        </Card>

        <Card title="Kelengkapan data">
          <div className="space-y-3">
            {COMPLETENESS.map(([label, status]) => (
              <ChecklistRow key={label} label={label} status={status} />
            ))}
          </div>
        </Card>

        <Card
          title="Asesmen petugas triase"
          subtitle="Asesmen oleh petugas berwenang. Temuan, waktu ukur, dan identitas petugas belum dicatat."
        >
          <p className="mb-3 text-xs font-semibold text-slate-700">Tanda vital</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {VITAL_FIELDS.map(([key, label, placeholder]) => (
              <FormField key={key} label={label} htmlFor={key} className="[&_label]:text-xs">
                <input
                  id={key}
                  value={form.vital[key] || ''}
                  onChange={(e) => setVital(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass()}
                />
              </FormField>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {ASSESSMENT_FIELDS.map(([key, label, placeholder]) => (
              <FormField key={key} label={label} htmlFor={key} className="[&_label]:text-xs">
                <input
                  id={key}
                  value={form.assessment[key] || ''}
                  onChange={(e) => setAssessment(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass()}
                />
              </FormField>
            ))}
            <FormField label="Catatan awal" htmlFor="catatan" className="[&_label]:text-xs">
              <textarea
                id="catatan"
                rows={4}
                value={form.catatan}
                onChange={(e) => setField('catatan', e.target.value)}
                placeholder="Catat faktor relevan, temuan pemeriksaan, dan alasan perubahan prioritas."
                className={`${inputClass()} resize-none`}
              />
            </FormField>
          </div>

          <div className="mt-4 space-y-0.5 text-xs text-slate-400">
            <p>Waktu pengukuran: belum tercatat</p>
            <p>Petugas pengukur: belum ditugaskan</p>
            <p>NIK/BPJS dapat dilengkapi kemudian; kelengkapan identitas tidak menunda pertolongan.</p>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:col-span-2">
        <Card
          title="Asesmen & prioritas"
          subtitle="AI belum tervalidasi klinis. Gunakan sebagai bantuan, bukan penentu triase akhir."
        >
          <p className="text-xs text-slate-600">Rekomendasi AI — menunggu input keluhan</p>
          <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
            <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
            Belum dapat ditentukan
          </span>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Data belum lengkap. Tenaga medis menilai kegawatan langsung; jangan menunggu AI bila ada
            tanda bahaya.
          </p>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-600">Status pelayanan:</p>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
              Menunggu Asesmen Klinis
            </span>

            <p className="mt-5 text-xs text-slate-600">Prioritas operasional:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PriorityBadge priority="merah" withDescription />
              <PriorityBadge priority="kuning" withDescription />
              <PriorityBadge priority="hijau" withDescription />
            </div>

            <p className="mt-5 text-xs text-slate-600">Jalur penanganan darurat:</p>
            <div className="mt-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-semibold leading-relaxed text-red-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Penanganan segera / panggil petugas medis. Jangan menunggu AI, NIK, BPJS, atau
              administrasi lengkap.
            </div>

            <p className="mt-5 text-xs text-slate-600">Luaran:</p>
            <div className="mt-2 space-y-2.5 text-xs text-slate-600">
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                Luaran kunjungan: belum ditetapkan.
              </p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                Meninggal: hanya setelah konfirmasi petugas medis berwenang. Waktu dan petugas wajib
                dicatat.
              </p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                Kategori hitam mengikuti SOP fasilitas; bukan hasil AI dan bukan antrean keempat.
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Catatan: Layar ini untuk simulasi asesmen awal FKTP/puskesmas. Data ini belum untuk
            keputusan klinis dan harus diverifikasi oleh tenaga medis.
          </p>
        </Card>

        <Card title="Verifikasi akhir & Kirim ke Database">
          <div className="space-y-3">
            {FINAL_CHECKS.map(([label, status]) => (
              <ChecklistRow key={label} label={label} status={status} />
            ))}
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-5 w-full rounded-lg py-3 text-sm font-semibold text-white transition ${
              isSubmitting
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-brand-700 hover:bg-brand-800'
            }`}
          >
            {isSubmitting
              ? isEdit
                ? 'Menyimpan perubahan...'
                : 'Mendaftarkan & Menganalisis AI...'
              : isEdit
                ? 'Simpan Perubahan Data Pasien'
                : 'Daftarkan Pasien ke Database'}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" className={buttonOutlineClass}>
              Ubah Prioritas
            </button>
            <button type="button" className={buttonOutlineClass}>
              Alasan perubahan
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            {isEdit
              ? 'Perubahan akan memperbarui data pasien pada database Supabase PostgreSQL. Prioritas akhir tetap ditetapkan petugas klinis sesuai kewenangan.'
              : 'Pendaftaran akan mengirim data ke database Supabase PostgreSQL dan memproses analisis AI. Prioritas akhir ditetapkan petugas klinis sesuai kewenangan. Alasan perubahan wajib dicatat jika prioritas diubah; jalur darurat tetap tersedia.'}
          </p>
        </Card>
      </div>
    </form>
  );
}
