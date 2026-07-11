import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** When true, clips the image to rounded corners (usually unnecessary — logo PNG is pre-rounded). */
  rounded?: boolean;
};

export default function Logo({
  size = 32,
  className,
  showWordmark = false,
  wordmarkClassName,
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
        <span className={cn('font-bold tracking-tight', wordmarkClassName)}>EB5 Base</span>
      )}
    </span>
  );
}
