import { TRIAGE_PRIORITY } from '../../utils/constants';

export default function PriorityBadge({ priority, withDescription = false, className = '' }) {
  const data = TRIAGE_PRIORITY[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${data.badgeClass} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${data.dotClass}`} aria-hidden="true" />
      {data.label}
      {withDescription && <> — {data.description}</>}
    </span>
  );
}
