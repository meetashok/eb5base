import Logo, { BrandWordmark } from '@/components/Logo';
import type { ReactNode } from 'react';

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-accent shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function AuthBrandPanel({
  title,
}: {
  title?: ReactNode;
}) {
  const heading = title ?? (
    <>
      Welcome to <BrandWordmark variant="on-dark" className="text-[0.85em]" />
    </>
  );

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-panel-gradient text-primary-content flex-col justify-center px-12 xl:px-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(201, 169, 98, 0.25), transparent 50%)',
        }}
      />
      <div className="relative">
        <Logo size={72} className="mb-6 drop-shadow-lg" />
        <h1 className="text-4xl font-bold mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          {heading}
        </h1>
        <p className="text-lg text-primary-content/70 mb-8">
          Free information tools for the EB-5 investor community
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckIcon />
            <span>Plain-English NPRM comment guide</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckIcon />
            <span>Status update builder for your community</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckIcon />
            <span>Case Tracker coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
