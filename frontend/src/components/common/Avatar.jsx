const PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
];

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
};

function getInitials(name) {
  return name
    .replace(/^(dr|drg)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function pickColor(name) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]} ${pickColor(name)} ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
