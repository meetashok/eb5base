import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export default function Logo({
  size = 32,
  className,
  showWordmark = false,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo.png"
        alt="EB5 Base"
        width={size}
        height={size}
        className="rounded-lg shrink-0"
        priority
      />
      {showWordmark && (
        <span className={cn('font-bold tracking-tight', wordmarkClassName)}>EB5 Base</span>
      )}
    </span>
  );
}
