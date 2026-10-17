export default function ProgressBar({ value, barClass = 'bg-brand-600', className = '' }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
    </div>
  );
}
