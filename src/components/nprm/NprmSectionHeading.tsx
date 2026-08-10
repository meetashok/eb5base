import type { ReactNode } from 'react';

type HeadingTag = 'h2' | 'h3';

/**
 * NPRM section header pattern: all-caps eyebrow + plain-English title.
 * Matches the Why Comment block used as the microsite template.
 */
export default function NprmSectionHeading({
  eyebrow,
  title,
  as = 'h3',
  className = '',
  titleClassName = 'text-base font-bold text-primary leading-snug',
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  as?: HeadingTag;
  className?: string;
  titleClassName?: string;
  children?: ReactNode;
}) {
  const TitleTag = as;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <p className="page-hero-eyebrow mb-0">{eyebrow}</p>
      <TitleTag className={titleClassName}>{title}</TitleTag>
      {children}
    </div>
  );
}
