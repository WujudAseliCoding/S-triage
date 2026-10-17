import { useState } from 'react';
import Avatar from '../../components/common/Avatar';
import { DOCTORS } from '../../data/mockData';
import { buttonOutlineClass, buttonPrimaryClass } from '../../utils/styles';

const STATUS_STYLE = {
  Tersedia: 'bg-emerald-500',
  Istirahat: 'bg-amber-500',
  Sibuk: 'bg-red-500',
};

function StatusDot({ status }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
      <span className={`size-2 rounded-full ${STATUS_STYLE[status]}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export default function DoctorManagementPage() {
  const [selectedId, setSelectedId] = useState(DOCTORS[0].id);
  const selected = DOCTORS.find((doctor) => doctor.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Simulasi FKTP Puskesmas Medan Selayang</h2>
          <p className="mt-1 text-xs text-slate-400">
            Data simulasi untuk operasional triase, layanan, dan penugasan petugas.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" className={buttonOutlineClass}>
            Atur Jadwal Kerja
          </button>
          <button type="button" className={buttonPrimaryClass}>
            + Tambah Petugas
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            {DOCTORS.map((doctor) => {
              const active = doctor.id === selectedId;
              return (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setSelectedId(doctor.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-xs transition hover:border-brand-300 ${
                    active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <Avatar name={doctor.nama} size="lg" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doctor.nama}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {doctor.peran} • {doctor.layanan}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <StatusDot status={doctor.status} />
                    <div className="text-right text-xs text-slate-400">
                      <p>Jadwal: {doctor.jadwal}</p>
                      <p>Jalur: {doctor.jalur}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Perawat triase • contoh simulasi</h3>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>Petugas: belum ditugaskan</p>
              <p>Jadwal: mengikuti penugasan fasilitas</p>
              <p>Verifikasi prioritas sesuai kompetensi dan kewenangan.</p>
            </div>
          </section>
        </div>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col items-center text-center">
            <Avatar name={selected.nama} size="xl" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{selected.nama}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selected.peran} • {selected.layanan}
            </p>
            <div className="mt-3">
              <StatusDot status={selected.status} />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Profil operasional</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Peran</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{selected.peran}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Kompetensi</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{selected.kompetensi}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Jadwal & penugasan</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-brand-600" aria-hidden="true" />
                {selected.hari}: {selected.jadwal}
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-brand-600" aria-hidden="true" />
                Jalur: {selected.jalur}
              </li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Catatan simulasi</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Data ini digunakan untuk simulasi operasional FKTP dan penugasan triase. Ketersediaan
              dipisahkan dari kewenangan klinis.
            </p>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            Kewenangan klinis mengikuti SOP dan kredensial fasilitas. Ketersediaan tidak otomatis
            memberi hak mengubah triase atau mengonfirmasi kematian.
          </p>
        </aside>
      </div>
    </div>
  );
}
