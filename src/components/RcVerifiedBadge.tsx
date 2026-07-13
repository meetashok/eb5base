type RcVerifiedBadgeProps = {
  className?: string;
  /** Use on dark hero backgrounds (project detail header). */
  variant?: 'default' | 'onDark';
  size?: 'sm' | 'md';
};

export default function RcVerifiedBadge({
  className = '',
  variant = 'default',
  size = 'md',
}: RcVerifiedBadgeProps) {
  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-2 py-0 min-h-0 h-5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5 badge-sm';

  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const colorClass =
    variant === 'onDark'
      ? 'bg-sky-500 text-white border-0 shadow-md ring-1 ring-white/20'
      : 'bg-sky-500 text-white border-0';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold shrink-0 ${sizeClass} ${colorClass} ${className}`}
      title="A verified regional center representative confirmed this listing's details."
    >
      <svg
        className={`${iconClass} shrink-0`}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      RC verified
    </span>
  );
}
