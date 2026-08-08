import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="page-hero-copy min-w-0">
            {eyebrow && <div className="page-hero-eyebrow">{eyebrow}</div>}
            <h1 className="page-hero-title">{title}</h1>
            {subtitle && <div className="page-hero-subtitle">{subtitle}</div>}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </section>
  );
}
