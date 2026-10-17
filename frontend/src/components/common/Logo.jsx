import { Ambulance } from 'lucide-react';

export default function Logo({ subtitle, inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${
          inverted ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'
        }`}
      >
        <Ambulance className="size-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="leading-tight">
        <p className={`text-xl font-bold tracking-tight ${inverted ? 'text-white' : 'text-brand-700'}`}>
          S-Triage
        </p>
        {subtitle && (
          <p className={`text-[11px] ${inverted ? 'text-brand-100' : 'text-slate-400'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
