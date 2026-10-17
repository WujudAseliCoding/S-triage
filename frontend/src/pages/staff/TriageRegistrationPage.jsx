import Card from '../../components/common/Card';
import FormField from '../../components/common/FormField';
import PriorityBadge from '../../components/common/PriorityBadge';
import { TriangleAlert } from 'lucide-react';
import { buttonOutlineClass, inputClass } from '../../utils/styles';

const SYMPTOM_CHIPS = ['Keluhan sesak napas', 'Demam tinggi', 'Batuk kering', 'Tanda vital belum lengkap'];

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
  ['Tekanan darah (mmHg)', 'Belum diukur'],
  ['Nadi (kali/menit)', 'Belum diukur'],
  ['Frekuensi napas (kali/menit)', 'Belum diukur'],
  ['SpO2 (%)', 'Belum diukur'],
  ['Suhu (°C)', 'Belum diukur'],
  ['Kesadaran', 'Belum dinilai'],
];

const ASSESSMENT_FIELDS = [
  ['nyeri', 'Nyeri', 'Belum dinilai'],
  ['alergi', 'Alergi obat', 'Belum diketahui'],
  ['faktor', 'Faktor relevan (kehamilan/anak)', 'Belum diketahui'],
  ['bahaya', 'Tanda bahaya', 'Belum dinilai'],
  ['riwayat', 'Riwayat penyakit', 'Belum lengkap'],
];

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

export default function TriageRegistrationPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-5">
      <div className="space-y-6 xl:col-span-3">
        <Card
          title="Data dari pasien — belum diverifikasi"
          subtitle="Informasi ini diberikan oleh pasien atau keluarga. Belum diverifikasi petugas dan belum dicocokkan dengan rekam medis."
        >
          <p className="mb-3 text-xs font-semibold text-slate-700">Identitas pasien</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama / identitas sementara" htmlFor="nama" className="text-xs">
              <input id="nama" defaultValue="Kurniawan Siregar" className={inputClass()} />
            </FormField>
            <FormField label="Tanggal lahir / umur" htmlFor="lahir">
              <input id="lahir" defaultValue="28 April 1991" className={inputClass()} />
            </FormField>
          </div>

          <p className="mb-3 mt-5 text-xs font-semibold text-slate-700">Identitas tambahan</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="NIK" htmlFor="nik">
              <input id="nik" placeholder="Belum lengkap" className={inputClass()} />
            </FormField>
            <FormField label="BPJS / asuransi" htmlFor="bpjs">
              <input id="bpjs" placeholder="Belum lengkap" className={inputClass()} />
            </FormField>
          </div>

          <FormField label="Keluhan utama" htmlFor="keluhan" className="mt-5">
            <textarea
              id="keluhan"
              rows={4}
              defaultValue="Pasien mengeluh demam tinggi sejak 3 hari yang lalu, disertai batuk kering dan sesak napas saat beraktivitas ringan. Data ini belum diverifikasi tenaga medis."
              className={`${inputClass()} resize-none border-brand-300 bg-brand-50/60`}
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
            {VITAL_FIELDS.map(([label, placeholder]) => (
              <FormField key={label} label={label} htmlFor={label} className="[&_label]:text-xs">
                <input id={label} placeholder={placeholder} className={inputClass()} />
              </FormField>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {ASSESSMENT_FIELDS.map(([id, label, placeholder]) => (
              <FormField key={id} label={label} htmlFor={id} className="[&_label]:text-xs">
                <input id={id} placeholder={placeholder} className={inputClass()} />
              </FormField>
            ))}
            <FormField label="Catatan awal" htmlFor="catatan" className="[&_label]:text-xs">
              <textarea
                id="catatan"
                rows={4}
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
          <p className="text-xs text-slate-600">Data kurang / dasar rekomendasi:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((chip) => (
              <span key={chip} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                {chip}
              </span>
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-600">Rekomendasi AI — belum terverifikasi</p>
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

        <Card title="Verifikasi akhir">
          <div className="space-y-3">
            {FINAL_CHECKS.map(([label, status]) => (
              <ChecklistRow key={label} label={label} status={status} />
            ))}
          </div>

          <button
            type="button"
            disabled
            className="mt-5 w-full rounded-lg bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Lengkapi asesmen dahulu
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
            Status belum siap diverifikasi. Prioritas ditetapkan petugas klinis sesuai kewenangan.
            Alasan perubahan wajib dicatat jika prioritas diubah; jalur darurat tetap tersedia.
          </p>
        </Card>
      </div>
    </div>
  );
}
