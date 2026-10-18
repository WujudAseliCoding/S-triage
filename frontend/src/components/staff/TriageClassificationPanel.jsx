import { useState } from 'react';
import Card from '../common/Card';
import FormField from '../common/FormField';
import { TriangleAlert, CheckCircle2, Cpu } from 'lucide-react';
import { TRIAGE_PRIORITY } from '../../utils/constants';
import { inputClass, buttonOutlineClass } from '../../utils/styles';
import { registerTriage, verifyTriage } from '../../services/triageService';

// Operational category -> colour token. This is NOT an ESI level.
const CATEGORY_TO_COLOR = { P1: 'merah', P2: 'kuning', P3: 'hijau' };

const INITIAL = {
  nama_pasien: 'Kurniawan Siregar',
  umur: '34',
  satuan_umur: 'Tahun',
  jenis_kelamin: 'L',
  keluhan_utama: 'Demam tinggi sejak 3 hari, batuk kering, dan sesak saat beraktivitas ringan.',
  sistole: '', diastole: '', nadi: '', pernapasan: '', spo2: '', suhu: '', skala_nyeri: '',
};

const VITAL_FIELDS = [
  ['sistole', 'Sistole (mmHg)'],
  ['diastole', 'Diastole (mmHg)'],
  ['nadi', 'Nadi (kali/menit)'],
  ['pernapasan', 'Napas (kali/menit)'],
  ['spo2', 'SpO2 (%)'],
  ['suhu', 'Suhu (°C)'],
];

function buildPayload(values) {
  const tanda_vital = {};
  for (const [key] of VITAL_FIELDS) {
    const raw = values[key];
    if (raw !== '' && raw !== null && raw !== undefined && !Number.isNaN(Number(raw))) {
      tanda_vital[key] = Number(raw);
    }
  }
  const payload = {
    nama_pasien: values.nama_pasien,
    umur: Number(values.umur),
    satuan_umur: values.satuan_umur,
    jenis_kelamin: values.jenis_kelamin,
    keluhan_utama: values.keluhan_utama,
    tanda_vital,
  };
  if (values.skala_nyeri !== '' && !Number.isNaN(Number(values.skala_nyeri))) {
    payload.skala_nyeri = Number(values.skala_nyeri);
  }
  return payload;
}

export default function TriageClassificationPanel() {
  const [values, setValues] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalPrioritas, setFinalPrioritas] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const runClassification = async (event) => {
    event.preventDefault();
    setError(null);
    setVerifyMsg(null);
    setResult(null);
    try {
      setLoading(true);
      const data = await registerTriage(buildPayload(values));
      setResult(data);
      setFinalPrioritas(data.classification?.category || '');
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menjalankan klasifikasi. Periksa koneksi backend.');
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async () => {
    if (!result?.patient?.id || !finalPrioritas) return;
    setVerifyMsg(null);
    try {
      setVerifying(true);
      const data = await verifyTriage(result.patient.id, {
        final_prioritas: finalPrioritas,
        override_reason: overrideReason || undefined,
      });
      setVerifyMsg(
        data.changed
          ? `Prioritas final ${data.final_prioritas} disimpan. Rekomendasi AI (${data.ai_recommended_category}) tetap tercatat terpisah.`
          : `Prioritas final ${data.final_prioritas} dikonfirmasi sesuai rekomendasi.`,
      );
    } catch (err) {
      setVerifyMsg(err?.response?.data?.message || 'Gagal menyimpan verifikasi.');
    } finally {
      setVerifying(false);
    }
  };

  const c = result?.classification;
  const color = c && CATEGORY_TO_COLOR[c.category] ? TRIAGE_PRIORITY[CATEGORY_TO_COLOR[c.category]] : null;

  return (
    <Card
      title="Klasifikasi & verifikasi petugas"
      subtitle="AI hanya mengusulkan. Prioritas akhir ditetapkan tenaga medis dan dicatat terpisah."
    >
      <form onSubmit={runClassification} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama pasien" htmlFor="ai-nama" className="[&_label]:text-xs">
            <input id="ai-nama" value={values.nama_pasien} onChange={(e) => setField('nama_pasien', e.target.value)} className={inputClass()} />
          </FormField>
          <FormField label="Umur" htmlFor="ai-umur" className="[&_label]:text-xs">
            <div className="flex gap-2">
              <input id="ai-umur" inputMode="numeric" value={values.umur} onChange={(e) => setField('umur', e.target.value.replace(/\D/g, '').slice(0, 3))} className={inputClass()} />
              <select value={values.satuan_umur} onChange={(e) => setField('satuan_umur', e.target.value)} className={`${inputClass()} w-28`}>
                {['Tahun', 'Bulan', 'Hari'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </FormField>
          <FormField label="Jenis kelamin" htmlFor="ai-jk" className="[&_label]:text-xs">
            <select id="ai-jk" value={values.jenis_kelamin} onChange={(e) => setField('jenis_kelamin', e.target.value)} className={inputClass()}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </FormField>
          <FormField label="Skala nyeri (0-10)" htmlFor="ai-nyeri" className="[&_label]:text-xs">
            <input id="ai-nyeri" inputMode="numeric" value={values.skala_nyeri} onChange={(e) => setField('skala_nyeri', e.target.value.replace(/\D/g, '').slice(0, 2))} className={inputClass()} placeholder="Belum dinilai" />
          </FormField>
        </div>

        <FormField label="Keluhan utama" htmlFor="ai-keluhan" className="[&_label]:text-xs">
          <textarea id="ai-keluhan" rows={3} value={values.keluhan_utama} onChange={(e) => setField('keluhan_utama', e.target.value)} className={`${inputClass()} resize-none`} />
        </FormField>

        <div>
          <p className="mb-3 text-xs font-semibold text-slate-700">Tanda vital (kosongkan bila belum diukur)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {VITAL_FIELDS.map(([key, label]) => (
              <FormField key={key} label={label} htmlFor={`ai-${key}`} className="[&_label]:text-xs">
                <input id={`ai-${key}`} inputMode="decimal" value={values[key]} onChange={(e) => setField(key, e.target.value.replace(/[^\d.]/g, ''))} className={inputClass()} placeholder="Belum diukur" />
              </FormField>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60">
          {loading ? 'Menjalankan klasifikasi…' : 'Jalankan klasifikasi AI'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {c && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold text-slate-700">Rekomendasi AI — belum terverifikasi</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {c.category && color ? (
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${color.badgeClass}`}>
                <span className={`size-1.5 rounded-full ${color.dotClass}`} aria-hidden="true" />
                {color.label} • kategori operasional {c.category}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
                Belum dapat ditentukan
              </span>
            )}
            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-600">
              status: {c.classification_status}
            </span>
            <span className={`rounded px-2 py-1 text-[10px] font-bold tracking-wide ${c.review_required ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              review_required: {String(c.review_required)}
            </span>
            {c.escalation?.required && (
              <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold tracking-wide text-red-700">
                eskalasi: {c.escalation.rule_ids?.join(', ') || 'ya'}
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Nomor antrean: {result?.queue?.nomor_antrean} • mode ekstraksi: {result?.extraction?.mode} • versi aturan: {c.rule_version} • ESI v4: tidak diterapkan (konteks FKTP)
          </p>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <p className="flex items-center gap-1.5 font-bold text-slate-800"><Cpu className="size-3.5" aria-hidden="true" /> Alasan dari aturan yang dijalankan</p>
            <p className="mt-1">{c.alasan_esi}</p>
            {c.applied_rule_ids?.length > 0 && (
              <p className="mt-1 text-slate-500">rule: {c.applied_rule_ids.join(', ')} • langkah: {c.decision_step || '-'}</p>
            )}
            {c.supporting_facts?.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-slate-500">
                {c.supporting_facts.map((f) => <li key={f.rule_id}>{f.rule_id}: {f.detail}</li>)}
              </ul>
            )}
            {c.missing_information?.length > 0 && (
              <p className="mt-1 text-amber-700">Informasi belum tersedia: {c.missing_information.join('; ')}</p>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-700">Verifikasi tenaga medis</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select value={finalPrioritas} onChange={(e) => setFinalPrioritas(e.target.value)} className={`${inputClass()} w-40`}>
                <option value="">Pilih prioritas final</option>
                <option value="P1">P1 — Merah</option>
                <option value="P2">P2 — Kuning</option>
                <option value="P3">P3 — Hijau</option>
                <option value="P0">P0 — Hitam (konfirmasi petugas)</option>
              </select>
              <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Alasan bila mengubah rekomendasi" className={`${inputClass()} flex-1`} />
              <button type="button" onClick={submitVerification} disabled={verifying || !finalPrioritas} className={`${buttonOutlineClass} px-3 py-2 text-xs`}>
                {verifying ? 'Menyimpan…' : 'Simpan verifikasi'}
              </button>
            </div>
            {verifyMsg && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden="true" /> {verifyMsg}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Warna Merah/Kuning/Hijau adalah kategori operasional S-Triage, bukan level ESI. AI belum
        tervalidasi klinis; keputusan akhir pada tenaga medis.
      </p>
    </Card>
  );
}
