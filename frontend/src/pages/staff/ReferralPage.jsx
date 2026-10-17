import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import FormField from '../../components/common/FormField';
import ProgressBar from '../../components/common/ProgressBar';
import Avatar from '../../components/common/Avatar';
import {
  FACILITY_CAPACITY,
  REFERRAL_HISTORY,
  REFERRAL_STEPS,
} from '../../data/mockData';
import { buttonOutlineClass, buttonPrimaryClass, inputClass } from '../../utils/styles';
import { getFacilities, getReferrals } from '../../services/referralService';

const INFO_BOXES = [
  ['Tujuan rujukan', 'RS Haji Medan', 'Dipilih berdasarkan kebutuhan pasien dan layanan yang relevan.'],
  ['Kebutuhan layanan', 'Belum ditentukan tenaga medis', 'Asesmen klinis diperlukan; ICU tidak diasumsikan'],
  ['Petugas pengirim', 'dr. Faisal Rahman', 'Kepala Triase • Puskesmas Medan Selayang'],
  ['Konfirmasi penerima', 'Belum dikonfirmasi', 'Petugas / waktu: belum ada'],
];

const COORDINATION_NOTES = [
  [
    'SOP rujukan',
    'Keputusan rujukan adalah keputusan klinis oleh tenaga medis. Data simulasi digunakan untuk bantu koordinasi, bukan untuk menentukan kesiapan penerima secara otomatis.',
  ],
  [
    'Status Diterima',
    'Diterima berarti fasilitas tujuan telah menerima permintaan rujukan. Pasien belum tentu selesai dirujuk sampai serah terima selesai.',
  ],
  [
    'Kebutuhan pasien',
    'Kebutuhan pasien dan kemampuan fasilitas tujuan lebih penting daripada okupansi total. Pastikan layanan yang relevan tersedia sebelum rujukan.',
  ],
];

const TEXT_FIELDS = [
  ['ringkasan', 'Ringkasan kondisi pasien', 'Pasien datang dengan keluhan demam, batuk, dan sesak napas. Status triase belum terverifikasi, perlu asesmen tenaga medis untuk menentukan kebutuhan rujukan?'],
  ['vital', 'Tanda vital terakhir', 'Belum diukur. Isi nilai, satuan, waktu pemeriksaan, dan petugas.'],
  ['tindakan', 'Tindakan awal / stabilisasi', 'Belum dicatat. Tenaga medis menilai dan mendokumentasikan tindakan awal sesuai kondisi.'],
  ['layanan', 'Kebutuhan layanan', 'Belum ditentukan berdasarkan asesmen klinis.'],
  ['kesiapan', 'Konfirmasi kesiapan menerima', 'Belum ada. Catat kesiapan layanan, petugas penerima, dan waktu konfirmasi.'],
  ['transport', 'Transportasi & pendamping', 'Belum ditentukan. Jenis ambulans, pendamping medis dan kebutuhan transportasi dinilai tenaga medis.'],
];

export default function ReferralPage() {
  const [facilities, setFacilities] = useState(FACILITY_CAPACITY);
  const [history, setHistory] = useState(REFERRAL_HISTORY);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getFacilities(), getReferrals()])
      .then(([facData, refData]) => {
        if (!isMounted) return;
        if (facData && facData.length > 0) {
          const mappedFac = facData.map((f) => ({
            nama: f.nama,
            detail: f.detail || `Jarak: ${f.jarak_km} km • Layanan: ${f.layanan}`,
            persen: f.kapasitas_persen,
            tone: f.tone || 'bg-emerald-500',
            text: f.text_class || 'text-emerald-600',
          }));
          setFacilities(mappedFac);
        }
        if (refData && refData.length > 0) {
          const mappedRef = refData.map((r) => {
            let tone = 'warning';
            if (r.status_rujukan === 'Diterima' || r.status_rujukan === 'Serah terima selesai') tone = 'success';
            if (r.status_rujukan === 'Ditolak') tone = 'danger';

            const tgl = r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '23 Mei 2026';
            return {
              nama: r.patient?.nama_pasien || 'Pasien Rujukan',
              detail: `${r.faskes_tujuan} • ${tgl}`,
              status: r.status_rujukan,
              tone,
            };
          });
          setHistory(mappedRef);
        }
        setIsLive(true);
      })
      .catch((err) => {
        console.warn('Gagal memuat data rujukan dari database:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Rujukan Eksternal & Ambulans</h2>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {isLive ? 'Live Supabase DB' : 'Data Cadangan'}
        </span>
      </div>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
        Keputusan rujukan adalah keputusan klinis oleh tenaga medis. Data kapasitas faskes
        dan koordinasi terhubung ke sistem faskes mitra. Pastikan kebutuhan pasien, kemampuan fasilitas tujuan,
        dan konfirmasi penerima sebelum pasien dikirim.
      </p>

      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Tahap rujukan">
        {REFERRAL_STEPS.map((step, index) => (
          <li
            key={step}
            aria-current={index === 0 ? 'step' : undefined}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
              index === 0
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card title="Pasien & tujuan rujukan">
            <Badge tone="warning" className="-mt-2 rounded-full">
              Draf • belum diverifikasi
            </Badge>
            <div className="mt-4 flex items-center gap-4">
              <Avatar name="Kurniawan Siregar" size="lg" className="rounded-xl" />
              <div>
                <p className="text-lg font-bold text-slate-900">Kurniawan Siregar</p>
                <p className="text-sm text-slate-500">Demam, batuk, sesak • triase belum terverifikasi</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {INFO_BOXES.map(([label, value, detail]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Form Rujukan Digital"
            subtitle="Data ini digunakan untuk koordinasi antar fasilitas, bukan sebagai keputusan otomatis. Pastikan asesmen klinis dan konfirmasi penerima selesai sebelum pengiriman."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {TEXT_FIELDS.map(([id, label, value]) => (
                <FormField key={id} label={label} htmlFor={id} className="[&_label]:text-xs">
                  <textarea
                    id={id}
                    rows={4}
                    defaultValue={value}
                    className={`${inputClass()} resize-none bg-slate-50`}
                  />
                </FormField>
              ))}
            </div>
            <FormField label="Serah terima" htmlFor="serah-terima" className="mt-5 [&_label]:text-xs">
              <textarea
                id="serah-terima"
                rows={2}
                defaultValue="Belum dilakukan. Catat pengirim, penerima, kondisi terakhir, dokumen, dan waktu serah terima."
                className={`${inputClass()} resize-none bg-slate-50`}
              />
            </FormField>

            <p className="mt-5 text-xs text-amber-700">
              Draf • belum siap diberangkatkan. Penilaian klinis dan konfirmasi penerima belum selesai.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className={buttonOutlineClass}>
                Simpan Draf
              </button>
              <button type="button" className={buttonPrimaryClass}>
                Ajukan koordinasi rujukan
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card title="Kapasitas Faskes Simulasi" subtitle="Pembaruan: 23 Mei 2026, 13:45 WIB">
            <div className="space-y-4">
              {facilities.map((facility) => (
                <div key={facility.nama}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{facility.nama}</p>
                      <p className="text-xs text-slate-400">{facility.detail}</p>
                    </div>
                    <span className={`text-sm font-bold ${facility.text}`}>{facility.persen}%</span>
                  </div>
                  <ProgressBar value={facility.persen} barClass={facility.tone} className="mt-2" />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-900">Catatan</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Persentase kapasitas adalah ilustrasi simulasi. Kesiapan penerima, layanan relevan, dan
                kebutuhan pasien lebih penting daripada okupansi total.
              </p>
            </div>
          </Card>

          <Card title="Riwayat Rujukan Terkini">
            <ul className="divide-y divide-slate-100">
              {history.map((item) => (
                <li key={item.nama} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.nama}</p>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                  <Badge tone={item.tone}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Catatan Koordinasi">
            <div className="space-y-3">
              {COORDINATION_NOTES.map(([title, text]) => (
                <div key={title} className="rounded-xl bg-slate-50 p-4">
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
