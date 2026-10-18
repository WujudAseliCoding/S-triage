import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import FormField from '../../components/common/FormField';
import EmergencyBox from '../../components/patient/EmergencyBox';
import { AGE_UNITS } from '../../utils/constants';
import {
  PATIENT_FORM_INITIAL,
  PATIENT_FORM_SUMMARY,
  patientFormSchema,
} from '../../utils/patientFormSchema';
import { inputClass } from '../../utils/styles';
import { registerTriagePatient } from '../../services/triageService';

const checkboxClass = 'size-5 shrink-0 rounded border-slate-300 accent-brand-700';

function SectionCard({ number, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
          {number}
        </span>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

// Hitung umur dari tanggal lahir; bayi memakai satuan bulan/hari agar tidak dibulatkan menjadi 0 tahun.
function ageFromBirthDate(isoDate) {
  const birth = new Date(isoDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years >= 1) return { umur: years, satuan: 'tahun' };
  if (months >= 1) return { umur: months, satuan: 'bulan' };
  const days = Math.max(1, Math.floor((now - birth) / 86400000));
  return { umur: days, satuan: 'hari' };
}

export default function PatientFormPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(PATIENT_FORM_INITIAL);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const errorKeys = Object.keys(errors);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = patientFormSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] ??= issue.message;
      });
      setErrors(fieldErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const data = result.data;
      const age = data.pakaiTanggalLahir
        ? ageFromBirthDate(data.tanggalLahir)
        : { umur: Number(data.umur), satuan: data.satuanUmur.toLowerCase() };

      const payload = {
        nama_pasien: data.nama,
        umur: age.umur,
        satuan_umur: age.satuan,
        jenis_kelamin: data.jenisKelamin,
        nik: data.tanpaNik ? undefined : data.nik || undefined,
        tanggal_lahir: data.pakaiTanggalLahir ? data.tanggalLahir : undefined,
        keluhan_utama: data.keluhan,
        waktu_mulai_keluhan: data.waktuMulai || undefined,
        alergi_obat: data.alergiTidakTahu ? 'Tidak tahu' : data.alergi || undefined,
        tanda_vital: {},
      };

      const res = await registerTriagePatient(payload);
      const referensi = `REG-${String(res?.patient?.id ?? '').slice(0, 8).toUpperCase()}`;

      navigate('/antrean', {
        state: {
          submission: {
            ...data,
            referensi,
          },
        },
      });
    } catch (err) {
      console.error('Pengiriman formulir pasien gagal:', err);
      setSubmitError(
        err?.response?.data?.message ||
          'Formulir belum terkirim. Periksa koneksi Anda lalu coba lagi, atau lapor langsung ke petugas pendaftaran.',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 px-4 py-6">
      <div>
        <span className="inline-block rounded-md bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600">
          Prototipe • Data contoh
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
          Sampaikan keluhan Anda
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Isi untuk pengajuan awal kepada petugas. Ini bukan diagnosis, hasil triase akhir, atau janji
          urutan layanan.
        </p>
      </div>

      <EmergencyBox />

      {errorKeys.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-bold text-red-700">Periksa {errorKeys.length} isian berikut</p>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {errorKeys.map((key) => (
              <li key={key}>{PATIENT_FORM_SUMMARY[key]}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-red-700">
            Belum terkirim. Umur dan isian lain tetap tersimpan pada formulir ini.
          </p>
        </div>
      )}

      {submitError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-bold text-red-700">Formulir belum terkirim</p>
          <p className="mt-1 text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <SectionCard
        number="01"
        title="Data pasien"
        subtitle="Hanya nama, umur, dan keluhan yang wajib diisi."
      >
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-800">Formulir ini diisi untuk</legend>
          <div className="space-y-3.5">
            {[
              ['sendiri', 'Diri sendiri'],
              ['keluarga', 'Pasien, dibantu keluarga'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="radio"
                  name="untuk"
                  value={value}
                  checked={values.untuk === value}
                  onChange={() => setField('untuk', value)}
                  className="size-5 accent-brand-700"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Isi identitas pasien, bukan identitas orang yang membantu.</p>
        </fieldset>

        <FormField label="Nama lengkap" tag="Wajib" htmlFor="nama" error={errors.nama}>
          <input
            id="nama"
            type="text"
            autoComplete="name"
            placeholder="Nama lengkap pasien"
            value={values.nama}
            onChange={(e) => setField('nama', e.target.value)}
            aria-invalid={Boolean(errors.nama)}
            className={inputClass(Boolean(errors.nama))}
          />
        </FormField>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-800">
            Jenis kelamin<span className="font-semibold text-slate-800"> • Wajib</span>
          </legend>
          <div className="flex gap-6">
            {[
              ['L', 'Laki-laki'],
              ['P', 'Perempuan'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="radio"
                  name="jenis-kelamin"
                  value={value}
                  checked={values.jenisKelamin === value}
                  onChange={() => setField('jenisKelamin', value)}
                  className="size-5 accent-brand-700"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.jenisKelamin && (
            <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
              ! {errors.jenisKelamin}
            </p>
          )}
        </fieldset>

        {values.pakaiTanggalLahir ? (
          <FormField label="Tanggal lahir" tag="Wajib" htmlFor="tanggal-lahir" error={errors.tanggalLahir}>
            <input
              id="tanggal-lahir"
              type="date"
              value={values.tanggalLahir}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setField('tanggalLahir', e.target.value)}
              aria-invalid={Boolean(errors.tanggalLahir)}
              className={inputClass(Boolean(errors.tanggalLahir))}
            />
          </FormField>
        ) : (
          <FormField
            label="Umur pasien"
            tag="Wajib"
            htmlFor="umur"
            error={errors.umur}
            hint={null}
          >
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input
                id="umur"
                type="text"
                inputMode="numeric"
                placeholder="Umur"
                value={values.umur}
                onChange={(e) => setField('umur', e.target.value.replace(/\D/g, '').slice(0, 3))}
                aria-invalid={Boolean(errors.umur)}
                className={inputClass(Boolean(errors.umur))}
              />
              <div className="relative">
                <label htmlFor="satuan-umur" className="sr-only">
                  Satuan umur
                </label>
                <select
                  id="satuan-umur"
                  value={values.satuanUmur}
                  onChange={(e) => setField('satuanUmur', e.target.value)}
                  className={`${inputClass()} appearance-none pr-10`}
                >
                  {AGE_UNITS.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Pilih satuan tahun, bulan, atau hari. Untuk bayi, gunakan bulan atau hari; jangan
              dibulatkan menjadi 0 tahun.
            </p>
          </FormField>
        )}

        <button
          type="button"
          onClick={() => setField('pakaiTanggalLahir', !values.pakaiTanggalLahir)}
          className="flex w-full items-center justify-between text-left text-sm font-bold text-brand-700"
        >
          {values.pakaiTanggalLahir ? 'Gunakan umur sebagai gantinya' : 'Gunakan tanggal lahir sebagai gantinya'}
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <p className="-mt-2 text-xs leading-relaxed text-slate-500">
          Tanggal lahir opsional sebagai alternatif umur. Cukup gunakan salah satu, tidak perlu
          mengisi keduanya.
        </p>

        <FormField
          label="NIK"
          tag={errors.nik ? 'Jika tersedia' : undefined}
          htmlFor="nik"
          error={errors.nik}
          hint="Masukkan 16 digit NIK tanpa spasi."
        >
          <input
            id="nik"
            type="text"
            inputMode="numeric"
            placeholder="16 digit NIK"
            value={values.nik}
            disabled={values.tanpaNik}
            onChange={(e) => setField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
            aria-invalid={Boolean(errors.nik)}
            className={inputClass(Boolean(errors.nik))}
          />
        </FormField>

        <div>
          <label className="flex items-center gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={values.tanpaNik}
              onChange={(e) => {
                setField('tanpaNik', e.target.checked);
                if (e.target.checked) setField('nik', '');
              }}
              className={checkboxClass}
            />
            Belum memiliki / tidak membawa NIK
          </label>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Jika tidak tersedia, pilih opsi di atas. Petugas membantu melengkapi dan memverifikasi
            NIK. Pertolongan tidak boleh tertunda karena NIK.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        number="02"
        title="Keluhan Anda"
        subtitle="Ceritakan yang dirasakan, tidak perlu menentukan penyakitnya."
      >
        <FormField
          label="Keluhan utama"
          tag="Wajib"
          htmlFor="keluhan"
          error={errors.keluhan}
          hint="Ceritakan sejak kapan, bagian tubuh yang terasa sakit, dan gejala lain yang menyertai."
        >
          <textarea
            id="keluhan"
            rows={5}
            placeholder="Tuliskan keluhan pasien di sini"
            value={values.keluhan}
            onChange={(e) => setField('keluhan', e.target.value)}
            aria-invalid={Boolean(errors.keluhan)}
            className={`${inputClass(Boolean(errors.keluhan))} resize-none`}
          />
        </FormField>

        <FormField label="Waktu mulai keluhan" tag="Opsional" htmlFor="waktu-mulai">
          <input
            id="waktu-mulai"
            type="text"
            placeholder="Contoh: sejak kemarin sore"
            value={values.waktuMulai}
            onChange={(e) => setField('waktuMulai', e.target.value)}
            className={inputClass()}
          />
        </FormField>

        <FormField label="Alergi obat" tag="Opsional" htmlFor="alergi">
          <input
            id="alergi"
            type="text"
            placeholder="Nama obat dan reaksi, bila diketahui"
            value={values.alergi}
            disabled={values.alergiTidakTahu}
            onChange={(e) => setField('alergi', e.target.value)}
            className={inputClass()}
          />
        </FormField>

        <div>
          <label className="flex items-center gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={values.alergiTidakTahu}
              onChange={(e) => {
                setField('alergiTidakTahu', e.target.checked);
                if (e.target.checked) setField('alergi', '');
              }}
              className={checkboxClass}
            />
            Tidak tahu
          </label>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Jika belum tahu, pilih “Tidak tahu”. Isian kosong tidak berarti tidak ada alergi.
          </p>
        </div>
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900">
          <ClipboardList className="size-5 text-brand-700" aria-hidden="true" />
          Penggunaan data Anda
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Data identitas dan keluhan digunakan untuk pendaftaran serta asesmen oleh petugas
          berwenang. Akses, penyimpanan, dan retensi perlu mengikuti kebijakan fasilitas.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Prototipe ini hanya untuk simulasi. Jangan masukkan NIK atau data kesehatan asli.
        </p>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-bold text-slate-900">Perlu bantuan mengisi?</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Minta bantuan keluarga atau petugas pendaftaran. Anda tidak perlu login, mengunggah KTP,
            atau mengisi formulir ini untuk mendapatkan pertolongan darurat.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Periksa sebelum mengirim</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Pastikan nama, umur beserta satuannya, NIK bila tersedia, dan keluhan pasien sudah sesuai.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full rounded-xl bg-brand-700 px-4 py-4 text-base font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Mengirim & Menganalisis AI...' : 'Kirim keluhan'}
        </button>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Pengiriman tidak menentukan prioritas triase atau nomor antrean. Kondisi pasien dinilai
          langsung oleh petugas.
        </p>
      </section>

      <section className="px-1 pt-2">
        <h2 className="text-base font-bold text-slate-900">Setelah mengirim, lapor petugas</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Datang atau lapor ke petugas pendaftaran untuk verifikasi data. Prioritas ditetapkan
          berdasarkan kondisi. Jika memburuk, segera minta bantuan petugas.
        </p>
      </section>
    </form>
  );
}
