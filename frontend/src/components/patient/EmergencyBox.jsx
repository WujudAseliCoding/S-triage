import { TriangleAlert } from 'lucide-react';

export default function EmergencyBox({ title = 'Butuh pertolongan segera?' }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="note">
      <p className="flex items-center gap-2 text-sm font-bold text-red-700">
        <TriangleAlert className="size-4.5" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-red-700/90">
        Sesak berat, nyeri dada berat, tidak sadar, atau perdarahan hebat adalah contoh tanda bahaya,
        bukan daftar lengkap.
      </p>
      <p className="mt-2 text-sm font-bold leading-relaxed text-red-700">
        Segera minta bantuan petugas atau ke IGD terdekat. Jangan menunggu formulir atau balasan.
      </p>
    </div>
  );
}
