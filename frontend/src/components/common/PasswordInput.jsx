import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({ id, value, onChange, error, ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`block w-full rounded-lg border bg-white py-3 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-slate-200 focus:border-brand-600 focus:ring-brand-100'
        }`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
      >
        <Icon className="size-4.5" />
      </button>
    </div>
  );
}