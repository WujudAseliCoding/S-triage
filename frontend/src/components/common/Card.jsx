export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) {
  const hasHeader = Boolean(title || action);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`px-6 pb-6 ${hasHeader ? 'pt-4' : 'pt-6'} ${bodyClassName}`}>{children}</div>
    </section>
  );
}
