// Class dasar input agar konsisten di seluruh form (halaman petugas & pasien).
export const inputClass = (hasError = false) =>
  `block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-200 focus:border-brand-600 focus:ring-brand-100'
  }`;

export const buttonPrimaryClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500';

export const buttonOutlineClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';
