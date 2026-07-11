import Image from 'next/image';
import { cn } from '@/lib/utils';

type WordmarkVariant = 'on-dark' | 'on-light';

type LogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  wordmarkVariant?: WordmarkVariant;
  /** When true, clips the image to rounded corners (usually unnecessary — logo PNG is pre-rounded). */
  rounded?: boolean;
};

const wordmarkPartStyles: Record<WordmarkVariant, { eb5: string; base: string }> = {
  'on-dark': {
    eb5: 'font-semibold text-primary-content/80',
    base: 'font-extrabold text-accent',
  },
  'on-light': {
    eb5: 'font-semibold text-primary/75',
    base: 'font-extrabold text-accent',
  },
};

export function BrandWordmark({
  className,
  variant = 'on-dark',
}: {
  className?: string;
  variant?: WordmarkVariant;
}) {
  const styles = wordmarkPartStyles[variant];
  return (
    <span className={cn('inline-flex items-baseline tracking-tight leading-none', className)}>
      <span className={cn('text-[0.92em]', styles.eb5)}>EB5</span>
      <span className={cn('text-[1em] ml-0.5', styles.base)}>Base</span>
    </span>
  );
}

export default function Logo({
  size = 32,
  className,
  showWordmark = false,
  wordmarkClassName,
  wordmarkVariant = 'on-dark',
  rounded = false,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo.png"
        alt="EB5 Base"
        width={size}
        height={size}
        className={cn('shrink-0', rounded && 'rounded-lg')}
        priority
      />
      {showWordmark && (
        <BrandWordmark className={wordmarkClassName} variant={wordmarkVariant} />
      )}
    </span>
  );
}
