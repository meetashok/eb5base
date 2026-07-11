import Logo from '@/components/Logo';

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function AuthBrandPanel({
  title = 'Join the EB-5 community',
}: {
  title?: string;
}) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-content flex-col justify-center px-12 xl:px-16">
      <Logo size={72} className="mb-6" />
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-lg text-primary-content/70 mb-8">
        Help build the most comprehensive directory of EB-5 projects
      </p>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckIcon />
          <span>Browse and compare EB-5 projects</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckIcon />
          <span>Confirm subscription status</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckIcon />
          <span>Track your investments</span>
        </div>
      </div>
    </div>
  );
}
