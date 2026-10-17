export default function FormField({
  label,
  htmlFor,
  tag,
  hint,
  error,
  className = '',
  children,
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {tag && <span className="font-semibold text-slate-800"> • {tag}</span>}
      </label>
      {hint && <p className="mb-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
          ! {error}
        </p>
      )}
    </div>
  );
}
