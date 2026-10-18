import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox, RefreshCw, TriangleAlert } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import FormField from '../../components/common/FormField';
import PriorityBadge from '../../components/common/PriorityBadge';
import { AGE_UNITS } from '../../utils/constants';
import { buttonOutlineClass, buttonPrimaryClass, inputClass } from '../../utils/styles';
import { getTriagePatients, getTriagePatientById, updateTriagePatient } from '../../services/triageService';

const POLL_INTERVAL_MS = 10000;

const TABS = [
  ['pending', 'Menunggu verifikasi'],
  ['done', 'Terverifikasi'],
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
  ['faktor', 'Faktor relevan (kehamilan/anak)', 'Belum diketahui'],
  ['bahaya', 'Tanda bahaya', 'Belum dinilai'],
  ['riwayat', 'Riwayat penyakit', 'Belum lengkap'],
];

// Kode prioritas backend -> badge prioritas di UI. Hitam (P0) bukan hasil AI dan mengikuti SOP fasilitas.
const PRIORITY_BADGE = { P1: 'merah', P2: 'kuning', P3: 'hijau' };
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3'];

const str = (value) => (value === null || value === undefined ? '' : String(value));

const fmtTime = (value) =>
  value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const refCode = (patient) => `REG-${String(patient.id).slice(0, 8).toUpperCase()}`;

function PriorityChip({ code, withDescription = false }) {
  if (code === 'P0') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
        <span className="size-1.5 rounded-full bg-slate-400" aria-hidden="true" />
        Hitam{withDescription && ' — Sesuai SOP fasilitas'}
      </span>
    );
  }
  return <PriorityBadge priority={PRIORITY_BADGE[code] || 'hijau'} withDescription={withDescription} />;
}

function toForm(patient) {
  const vital = patient.tanda_vital || {};
  const assessment = patient.asesmen || {};
  return {
    nama_pasien: str(patient.nama_pasien),
    umur: str(patient.umur),
    satuan_umur: patient.satuan_umur || 'tahun',
    jenis_kelamin: patient.jenis_kelamin || 'L',
    nik: str(patient.nik),
    tanggal_lahir: str(patient.tanggal_lahir),
    keluhan_utama: str(patient.keluhan_utama),
    waktu_mulai_keluhan: str(patient.waktu_mulai_keluhan),
    alergi_obat: str(patient.alergi_obat),
    vital: {
      tekanan_darah: str(vital.tekanan_darah ?? vital.tensi),
      nadi: str(vital.nadi),
      frekuensi_napas: str(vital.frekuensi_napas ?? vital.rr ?? vital.pernapasan),
      spo2: str(vital.spo2),
      suhu: str(vital.suhu),
      kesadaran: str(vital.kesadaran),
    },
    asesmen: {
      nyeri: str(assessment.nyeri),
      faktor: str(assessment.faktor),
      bahaya: str(assessment.bahaya),
      riwayat: str(assessment.riwayat),
    },
    catatan_petugas: str(patient.catatan_petugas),
    prioritas_triage: patient.prioritas_triage || 'P3',
    alasan_override: str(patient.alasan_override),
  };
}

const compact = (object) =>
  Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ''),
  );

function toPayload(form, verifikasi) {
  return {
    nama_pasien: form.nama_pasien.trim(),
    umur: Number(form.umur),
    satuan_umur: form.satuan_umur,
    jenis_kelamin: form.jenis_kelamin,
    nik: form.nik.trim(),
    tanggal_lahir: form.tanggal_lahir,
    keluhan_utama: form.keluhan_utama.trim(),
    waktu_mulai_keluhan: form.waktu_mulai_keluhan.trim(),
    alergi_obat: form.alergi_obat.trim(),
    tanda_vital: compact(form.vital),
    asesmen: compact(form.asesmen),
    catatan_petugas: form.catatan_petugas.trim(),
    prioritas_triage: form.prioritas_triage,
    alasan_override: form.alasan_override.trim(),
    verifikasi,
  };
}

function validate(form, verifikasi, aiCode) {
  const errors = {};
  const umur = Number(form.umur);
  if (form.nama_pasien.trim().length < 2) errors.nama_pasien = 'Nama minimal 2 karakter.';
  if (!form.umur || !Number.isInteger(umur) || umur <= 0) errors.umur = 'Isi umur dengan angka lebih dari 0.';
  if (form.nik.trim() && !/^\d{16}$/.test(form.nik.trim())) errors.nik = 'NIK harus 16 digit angka.';
  if (form.keluhan_utama.trim().length < 3) errors.keluhan_utama = 'Keluhan utama wajib diisi.';
  if (verifikasi && form.prioritas_triage !== aiCode && !form.alasan_override.trim()) {
    errors.alasan_override = 'Alasan perubahan prioritas wajib diisi.';
  }
  return errors;
}

function apiMessage(error) {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.map((item) => item.message).join(' ');
  return data?.message || 'Gagal menyimpan. Pastikan backend aktif lalu coba lagi.';
}

function StatusTag({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-600',
    good: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ChecklistRow({ label, status, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>{label}</span>
      <StatusTag tone={tone}>{status}</StatusTag>
    </div>
  );
}

function PatientListItem({ patient, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      aria-pressed={active}
      className={`w-full rounded-xl border bg-white p-3.5 text-left transition hover:border-brand-300 ${
        active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{patient.nama_pasien}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {patient.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'} • {patient.umur} {patient.satuan_umur}
          </p>
        </div>
        {patient.queue?.nomor_antrean && (
          <span className="shrink-0 rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
            {patient.queue.nomor_antrean}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{patient.keluhan_utama}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <PriorityChip code={patient.prioritas_triage} />
        <span className="text-[11px] text-slate-400">
          Masuk {fmtTime(patient.queue?.waktu_masuk || patient.createdAt)}
        </span>
      </div>
    </button>
  );
}

export default function TriageRegistrationPage() {
  const [tab, setTab] = useState('pending');
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState({ pending: 0, done: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingMode, setSavingMode] = useState(null);

  // Pasien yang mengisi formulir keluhan muncul otomatis: daftar dimuat ulang berkala.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getTriagePatients({ verifikasi: tab });
        if (!active) return;
        setPatients(result.patients);
        setMeta(result.meta);
        setLoadError('');
        setLastSync(new Date());
      } catch {
        if (active) setLoadError('Gagal memuat daftar pasien. Pastikan backend aktif dan Anda sudah login.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tab, refreshKey]);

  const changeTab = (nextTab) => {
    if (nextTab === tab) return;
    setTab(nextTab);
    setPatients([]);
    setIsLoading(true);
  };

  const selectPatient = (patient) => {
    setSelected(patient);
    setForm(toForm(patient));
    setErrors({});
    setSaveError('');
    setNotice('');
  };

  // Deep-link dari papan antrean: /registrasi-triase?edit=<id> langsung membuka pasien tersebut.
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  useEffect(() => {
    if (!editId) return undefined;
    let active = true;
    getTriagePatientById(editId)
      .then((patient) => {
        if (active && patient) selectPatient(patient);
      })
      .catch(() => {
        if (active) setLoadError('Gagal memuat data pasien yang akan diedit.');
      });
    return () => {
      active = false;
    };
  }, [editId]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const setGroup = (group, key, value) =>
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  const aiCode = selected ? selected.prioritas_ai || selected.prioritas_triage : null;
  const isOverride = Boolean(form && aiCode && form.prioritas_triage !== aiCode);
  const isVerified = Boolean(selected && selected.status_verifikasi !== 'BELUM_DIVERIFIKASI');

  const handleSave = async (verifikasi) => {
    setSaveError('');
    setNotice('');
    const found = validate(form, verifikasi, aiCode);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setSavingMode(verifikasi ? 'verify' : 'draft');
    try {
      const updated = await updateTriagePatient(selected.id, toPayload(form, verifikasi));
      setSelected(updated);
      setForm(toForm(updated));
      setNotice(verifikasi ? 'Pasien berhasil diverifikasi.' : 'Perubahan data tersimpan.');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setSaveError(apiMessage(error));
    } finally {
      setSavingMode(null);
    }
  };

  const missingData = form
    ? [
        !form.nik.trim() && 'NIK belum lengkap',
        !Object.values(form.vital).some((value) => value.trim()) && 'Tanda vital belum diukur',
        !form.alergi_obat.trim() && 'Alergi obat belum diketahui',
      ].filter(Boolean)
    : [];

  const nikComplete = Boolean(form && /^\d{16}$/.test(form.nik.trim()));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-12">
      {/* ── Daftar pasien masuk dari formulir keluhan ── */}
      <Card
        title="Pasien masuk"
        subtitle="Data berasal dari formulir keluhan yang diisi pasien (QR code). Klik pasien untuk memverifikasi atau mengedit."
        className="self-start xl:col-span-4"
        action={
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Muat ulang daftar pasien"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => changeTab(key)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                tab === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  key === 'pending' && meta.pending > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {meta[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {loadError && (
            <p className="rounded-lg bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700" role="alert">
              {loadError}
            </p>
          )}
          {isLoading && !loadError && (
            <p className="py-8 text-center text-xs text-slate-400">Memuat daftar pasien…</p>
          )}
          {!isLoading && !loadError && patients.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Inbox className="size-8 text-slate-300" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-slate-500">
                {tab === 'pending'
                  ? 'Belum ada pasien yang menunggu verifikasi. Pasien yang mengirim formulir keluhan akan muncul di sini otomatis.'
                  : 'Belum ada pasien yang diverifikasi.'}
              </p>
            </div>
          )}
          {patients.map((patient) => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              active={selected?.id === patient.id}
              onSelect={selectPatient}
            />
          ))}
        </div>

        {lastSync && (
          <p className="mt-3 text-[11px] text-slate-400">
            Diperbarui {lastSync.toLocaleTimeString('id-ID')} • otomatis tiap {POLL_INTERVAL_MS / 1000} detik
          </p>
        )}
      </Card>

      {/* ── Detail pasien terpilih ── */}
      <div className="space-y-6 xl:col-span-8">
        {!selected || !form ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Inbox className="size-10 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-bold text-slate-700">Pilih pasien dari daftar</p>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                Data pasien terisi otomatis dari formulir keluhan. Periksa, lengkapi asesmen, lalu verifikasi.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-xs">
              <div>
                <p className="text-xs text-slate-500">Nomor antrean</p>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {selected.queue?.nomor_antrean ?? '—'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Ref. formulir {refCode(selected)}</p>
              </div>
              <div className="space-y-1.5 text-right text-xs text-slate-500">
                <p>Masuk {fmtDateTime(selected.queue?.waktu_masuk || selected.createdAt)}</p>
                <Badge tone={isVerified ? 'success' : 'warning'}>
                  {selected.status_verifikasi === 'OVERRIDDEN'
                    ? 'Terverifikasi • prioritas diubah'
                    : isVerified
                      ? 'Terverifikasi'
                      : 'Menunggu verifikasi'}
                </Badge>
              </div>
            </div>

            <Card
              title="Data dari pasien"
              subtitle="Diisi pasien atau keluarga lewat formulir keluhan. Periksa dan koreksi bila perlu sebelum diverifikasi."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nama / identitas sementara" htmlFor="nama" error={errors.nama_pasien}>
                  <input
                    id="nama"
                    value={form.nama_pasien}
                    onChange={(e) => setField('nama_pasien', e.target.value)}
                    className={inputClass(Boolean(errors.nama_pasien))}
                  />
                </FormField>
                <FormField label="Umur" htmlFor="umur" error={errors.umur}>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input
                      id="umur"
                      inputMode="numeric"
                      value={form.umur}
                      onChange={(e) => setField('umur', e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className={inputClass(Boolean(errors.umur))}
                    />
                    <select
                      aria-label="Satuan umur"
                      value={form.satuan_umur}
                      onChange={(e) => setField('satuan_umur', e.target.value)}
                      className={inputClass()}
                    >
                      {AGE_UNITS.map((unit) => (
                        <option key={unit} value={unit.toLowerCase()}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold text-slate-800">Jenis kelamin</legend>
                  <div className="flex gap-5 pt-2">
                    {[
                      ['L', 'Laki-laki'],
                      ['P', 'Perempuan'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="jenis_kelamin"
                          value={value}
                          checked={form.jenis_kelamin === value}
                          onChange={() => setField('jenis_kelamin', value)}
                          className="size-4 accent-brand-700"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <FormField label="NIK" htmlFor="nik" error={errors.nik}>
                  <input
                    id="nik"
                    inputMode="numeric"
                    value={form.nik}
                    placeholder="Belum lengkap"
                    onChange={(e) => setField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className={inputClass(Boolean(errors.nik))}
                  />
                </FormField>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Tanggal lahir" htmlFor="tanggal-lahir">
                  <input
                    id="tanggal-lahir"
                    type="date"
                    value={form.tanggal_lahir}
                    onChange={(e) => setField('tanggal_lahir', e.target.value)}
                    className={inputClass()}
                  />
                </FormField>
                <FormField label="Waktu mulai keluhan" htmlFor="waktu-mulai">
                  <input
                    id="waktu-mulai"
                    value={form.waktu_mulai_keluhan}
                    placeholder="Contoh: sejak kemarin sore"
                    onChange={(e) => setField('waktu_mulai_keluhan', e.target.value)}
                    className={inputClass()}
                  />
                </FormField>
              </div>

              <FormField label="Alergi obat" htmlFor="alergi" className="mt-4">
                <input
                  id="alergi"
                  value={form.alergi_obat}
                  placeholder="Belum diketahui"
                  onChange={(e) => setField('alergi_obat', e.target.value)}
                  className={inputClass()}
                />
              </FormField>

              <FormField label="Keluhan utama" htmlFor="keluhan" error={errors.keluhan_utama} className="mt-4">
                <textarea
                  id="keluhan"
                  rows={4}
                  value={form.keluhan_utama}
                  onChange={(e) => setField('keluhan_utama', e.target.value)}
                  className={`${inputClass(Boolean(errors.keluhan_utama))} resize-none border-brand-300 bg-brand-50/60`}
                />
              </FormField>
            </Card>

            <Card title="Kelengkapan data">
              <div className="space-y-3">
                <ChecklistRow
                  label="Identitas kunjungan / nomor antrean"
                  status={selected.queue?.nomor_antrean ? `TERTAUT • ${selected.queue.nomor_antrean}` : 'BELUM TERTAUT'}
                  tone={selected.queue?.nomor_antrean ? 'good' : 'neutral'}
                />
                <ChecklistRow label="NIK" status={nikComplete ? 'LENGKAP' : 'BELUM LENGKAP'} tone={nikComplete ? 'good' : 'warn'} />
                <ChecklistRow label="Pencocokan duplikasi" status="BELUM DIPERIKSA" />
                <ChecklistRow
                  label="Waktu datang"
                  status={`TERCATAT • ${fmtTime(selected.queue?.waktu_masuk || selected.createdAt)}`}
                  tone="good"
                />
                <ChecklistRow label="Sumber data" status="FORMULIR PASIEN (QR)" tone="good" />
              </div>
            </Card>

            <Card
              title="Asesmen petugas triase"
              subtitle="Asesmen oleh petugas berwenang. Isi temuan pemeriksaan sebelum menetapkan prioritas."
            >
              <p className="mb-3 text-xs font-semibold text-slate-700">Tanda vital</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {VITAL_FIELDS.map(([key, label, placeholder]) => (
                  <FormField key={key} label={label} htmlFor={`vital-${key}`} className="[&_label]:text-xs">
                    <input
                      id={`vital-${key}`}
                      value={form.vital[key]}
                      placeholder={placeholder}
                      onChange={(e) => setGroup('vital', key, e.target.value)}
                      className={inputClass()}
                    />
                  </FormField>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {ASSESSMENT_FIELDS.map(([key, label, placeholder]) => (
                  <FormField key={key} label={label} htmlFor={`asesmen-${key}`} className="[&_label]:text-xs">
                    <input
                      id={`asesmen-${key}`}
                      value={form.asesmen[key]}
                      placeholder={placeholder}
                      onChange={(e) => setGroup('asesmen', key, e.target.value)}
                      className={inputClass()}
                    />
                  </FormField>
                ))}
                <FormField label="Catatan awal" htmlFor="catatan" className="[&_label]:text-xs">
                  <textarea
                    id="catatan"
                    rows={4}
                    value={form.catatan_petugas}
                    placeholder="Catat faktor relevan, temuan pemeriksaan, dan alasan perubahan prioritas."
                    onChange={(e) => setField('catatan_petugas', e.target.value)}
                    className={`${inputClass()} resize-none`}
                  />
                </FormField>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                NIK/BPJS dapat dilengkapi kemudian; kelengkapan identitas tidak menunda pertolongan.
              </p>
            </Card>

            <Card
              title="Asesmen & prioritas"
              subtitle="AI belum tervalidasi klinis. Gunakan sebagai bantuan, bukan penentu triase akhir."
            >
              <p className="text-xs text-slate-600">Rekomendasi AI — belum terverifikasi</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <PriorityChip code={aiCode} withDescription />
                {selected.skor_urgensi != null && (
                  <span className="text-xs font-semibold text-slate-500">Skor urgensi {selected.skor_urgensi}/5</span>
                )}
              </div>
              {selected.analisis_ai && (
                <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-3.5 text-xs leading-relaxed text-brand-700">
                  {selected.analisis_ai}
                </p>
              )}

              {missingData.length > 0 && (
                <>
                  <p className="mt-5 text-xs text-slate-600">Data kurang:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingData.map((item) => (
                      <span key={item} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold text-slate-700">Prioritas operasional (ditetapkan petugas)</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {(aiCode === 'P0' ? [...PRIORITY_OPTIONS, 'P0'] : PRIORITY_OPTIONS).map((code) => {
                    const active = form.prioritas_triage === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setField('prioritas_triage', code)}
                        className={`rounded-xl border bg-white p-3 text-left transition ${
                          active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        <PriorityChip code={code} withDescription />
                        {aiCode === code && (
                          <p className="mt-1.5 text-[11px] font-semibold text-slate-500">Rekomendasi AI</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isOverride && (
                  <FormField
                    label="Alasan perubahan prioritas"
                    tag="Wajib"
                    htmlFor="alasan"
                    error={errors.alasan_override}
                    className="mt-4 [&_label]:text-xs"
                  >
                    <textarea
                      id="alasan"
                      rows={3}
                      value={form.alasan_override}
                      placeholder="Jelaskan dasar klinis mengubah prioritas dari rekomendasi AI."
                      onChange={(e) => setField('alasan_override', e.target.value)}
                      className={`${inputClass(Boolean(errors.alasan_override))} resize-none`}
                    />
                  </FormField>
                )}

                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-semibold leading-relaxed text-red-700">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Jalur darurat: penanganan segera / panggil petugas medis. Jangan menunggu AI, NIK, BPJS, atau
                  administrasi lengkap.
                </div>
              </div>
            </Card>

            <Card title="Verifikasi akhir">
              <div className="space-y-3">
                <ChecklistRow
                  label="Prioritas dipilih petugas"
                  status={isVerified ? `DITETAPKAN • ${selected.prioritas_triage}` : 'BELUM DIVERIFIKASI'}
                  tone={isVerified ? 'good' : 'neutral'}
                />
                <ChecklistRow
                  label="Identitas verifikator"
                  status={selected.nama_verifikator || 'BELUM DITUGASKAN'}
                  tone={selected.nama_verifikator ? 'good' : 'neutral'}
                />
                <ChecklistRow
                  label="Waktu verifikasi"
                  status={selected.waktu_verifikasi ? fmtDateTime(selected.waktu_verifikasi) : 'BELUM ADA'}
                  tone={selected.waktu_verifikasi ? 'good' : 'neutral'}
                />
                <ChecklistRow
                  label="Alasan override"
                  status={isOverride ? 'WAJIB DIISI' : 'TIDAK ADA PERUBAHAN'}
                  tone={isOverride ? 'warn' : 'neutral'}
                />
                <ChecklistRow label="Terakhir / jadwal penilaian ulang" status="MENGIKUTI SOP" />
                <ChecklistRow label="Eskalasi kondisi memburuk" status="SEGERA PANGGIL PETUGAS" />
              </div>

              {saveError && (
                <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700" role="alert">
                  {saveError}
                </p>
              )}
              {notice && (
                <p className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-xs font-semibold text-emerald-700" role="status">
                  {notice}
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={savingMode !== null}
                  onClick={() => handleSave(false)}
                  className={`${buttonOutlineClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {savingMode === 'draft' ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
                <button
                  type="button"
                  disabled={savingMode !== null}
                  onClick={() => handleSave(true)}
                  className={buttonPrimaryClass}
                >
                  {savingMode === 'verify'
                    ? 'Memverifikasi…'
                    : isVerified
                      ? 'Verifikasi ulang'
                      : 'Verifikasi & tetapkan prioritas'}
                </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Prioritas akhir ditetapkan petugas klinis sesuai kewenangan. Alasan perubahan wajib dicatat jika
                prioritas diubah dari rekomendasi AI; jalur darurat tetap tersedia.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
