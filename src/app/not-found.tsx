import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80">
        <div className="max-w-xl mx-auto px-4 py-12 md:py-16 text-center">
          <Image
            src="/404-eagle-mascot.png"
            alt="A friendly eagle who could not find this page"
            width={200}
            height={200}
            className="mx-auto mb-4 shadow-soft rounded-2xl"
            priority
          />
          <p className="hero-eyebrow mb-3">404 · Page not found</p>
          <h1 className="text-3xl md:text-4xl font-bold hero-headline tracking-tight text-balance">
            This page isn&apos;t open for subscriptions
          </h1>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-10 md:py-14">
        <div className="card-elevated p-8 md:p-10 text-center space-y-6">
          <p className="text-neutral/70 leading-relaxed">
            Our eagle checked the file. This URL is not in the directory: not approved, not
            pending, not anywhere on EB5 Base. The good news is that unlike EB-5, a wrong click
            costs you nothing.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn btn-primary rounded-full">
              Go home
            </Link>
            <Link href="/projects" className="btn btn-ghost rounded-full">
              Browse projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
