import { useState, useEffect } from 'react';
import Avatar from '../../components/common/Avatar';
import { DOCTORS } from '../../data/mockData';
import { buttonOutlineClass, buttonPrimaryClass } from '../../utils/styles';
import { getDoctors, updateDoctorStatus } from '../../services/doctorService';

const STATUS_STYLE = {
  Tersedia: 'bg-emerald-500',
  Istirahat: 'bg-amber-500',
  Sibuk: 'bg-red-500',
  OFF: 'bg-slate-400',
};

function StatusDot({ status }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
      <span className={`size-2 rounded-full ${STATUS_STYLE[status] || 'bg-slate-400'}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState(DOCTORS);
  const [selectedId, setSelectedId] = useState(DOCTORS[0].id);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getDoctors()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        const mapped = data.map((d) => ({
          id: d.id,
          nama: d.nama,
          peran: d.spesialisasi || 'Dokter Umum',
          layanan: d.layanan || 'Layanan FKTP & Triase',
          kompetensi: d.kompetensi || 'FKTP & Triase',
          status: d.status || 'Tersedia',
          jadwal: d.jadwal || '08:00–14:00',
          jalur: d.jalur || 'Umum',
          hari: d.hari || 'Senin–Jumat',
        }));
        setDoctors(mapped);
        setSelectedId(mapped[0].id);
        setIsLive(true);
      })
      .catch((err) => {
        console.warn('Gagal memuat dokter dari database, menggunakan data cadangan:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    try {
      await updateDoctorStatus(selected.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === selected.id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error('Gagal memperbarui status dokter:', err);
    }
  };

  const selected = doctors.find((doctor) => doctor.id === selectedId) || doctors[0] || DOCTORS[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">FKTP Puskesmas Medan Selayang</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              {isLive ? 'Live Supabase DB' : 'Simulasi'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Data operasional triase, layanan, dan penugasan dokter/petugas.
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
            {doctors.map((doctor) => {
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
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {['Tersedia', 'Istirahat', 'Sibuk', 'OFF'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    selected.status === st
                      ? 'bg-brand-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
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
