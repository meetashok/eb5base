import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <Image
              src="/404-eagle-mascot.png"
              alt="A friendly eagle who could not find this page"
              width={180}
              height={180}
              className="shrink-0 w-36 h-36 md:w-44 md:h-44 object-contain"
              priority
            />
            <div className="text-center md:text-left flex-1 min-w-0">
              <p className="hero-eyebrow mb-3">404 · Page not found</p>
              <h1 className="text-3xl md:text-4xl font-bold hero-headline tracking-tight text-balance">
                This page isn&apos;t open for subscriptions
              </h1>
              <p className="text-neutral/70 leading-relaxed mt-4">
                Our eagle checked the file. This URL is not in the directory: not approved, not
                pending, not anywhere on EB5 Base.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center md:justify-start">
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
      </section>
    </div>
  );
}
