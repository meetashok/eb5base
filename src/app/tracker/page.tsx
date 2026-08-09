import Link from 'next/link';
import { redirect } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';
import { createClient } from '@/lib/supabase-server';

export const metadata = {
  title: 'Case Tracker',
  description:
    'EB-5 Case Tracker: follow USCIS updates for your petitions. Receipt numbers stay private from other investors and from EB5 Base staff views.',
};

const FEATURES = [
  {
    title: 'Track every application',
    body: 'Follow your EB-5 journey across I-526E, I-485, I-131, and I-765 for you and your family in one dashboard.',
  },
  {
    title: 'Email when status changes',
    body: 'Get an immediate alert or a daily digest when USCIS updates a case you are tracking.',
  },
  {
    title: 'Compare with your cohort',
    body: 'See anonymized insights for your project and filing quarter once enough investors are tracking.',
  },
];

const PRIVACY_POINTS = [
  'Receipt numbers are encrypted at rest with server-side AES-256-GCM. Plaintext is never stored in the database.',
  'Decryption happens only for automated USCIS polling and when you view your own cases while logged in.',
  'No admin UI shows raw receipt numbers, only masked forms like IOE09326XXXXX.',
  'Row Level Security ensures you can only access your own data.',
  'Every decryption is written to an audit log.',
  'You can delete your account at any time and permanently remove your data.',
];

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <svg
        className="w-5 h-5 text-secondary shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

export const dynamic = 'force-dynamic';

export default async function TrackerLandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.onboarding_complete) {
      redirect('/tracker/timeline');
    }
  }

  const startHref = user
    ? '/tracker/onboarding'
    : '/login?redirect=/tracker/onboarding';

  return (
    <div>
      <PageHero
        eyebrow={<span>Case Tracker</span>}
        title="Your immigration timeline, encrypted and up to date"
        subtitle={
          <p>
            <BrandWordmark variant="on-light" className="font-semibold" /> helps EB-5 investors
            track USCIS case status, get notified on changes, and learn from anonymized community
            insights without exposing receipt numbers to other investors or on EB5 Base.
          </p>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="card-elevated p-6 md:p-8 space-y-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-primary">Ready to track your cases?</h2>
          <p className="text-sm text-neutral/70 max-w-xl mx-auto leading-relaxed">
            Sign in, add encrypted receipt numbers, and check status from one place. Local and demo
            environments use a stub USCIS mode until live credentials are configured.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            <Link href={startHref} className="btn btn-accent text-accent-content rounded-full px-8">
              {user ? 'Continue setup' : 'Get started'}
            </Link>
            <Link href="/status" className="btn btn-outline rounded-full">
              Use Status Update meanwhile
            </Link>
            <Link href="/nprm" className="btn btn-ghost rounded-full">
              NPRM guide
            </Link>
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              Waitlist
            </p>
            <h2 className="text-xl font-bold text-primary">Notify me when Case Tracker expands</h2>
            <p className="text-sm text-neutral/70 mt-1 leading-relaxed">
              Email us and we will add you to the notify list. No backend form yet — opens your mail
              client.
            </p>
          </div>
          <form
            action="mailto:hello@eb5base.com?subject=Case%20Tracker%20notify%20me"
            method="get"
            className="flex flex-col sm:flex-row gap-2 max-w-lg"
          >
            <label className="sr-only" htmlFor="tracker-waitlist-email">
              Email
            </label>
            <input
              id="tracker-waitlist-email"
              type="email"
              name="body"
              required
              placeholder="you@example.com"
              className="input input-bordered w-full"
            />
            <button type="submit" className="btn btn-primary text-primary-content shrink-0">
              Notify me
            </button>
          </form>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              Vision
            </p>
            <h2 className="text-xl font-bold text-primary">
              Illustrative cohort insight (not live data)
            </h2>
            <p className="text-sm text-neutral/70 mt-1 leading-relaxed">
              Example chart concept: median I-526E progress by filing quarter for India. Real
              charts will use opt-in anonymized cohort data only.
            </p>
          </div>
          <div
            className="rounded-xl border border-dashed border-base-300 bg-base-200/40 p-4"
            aria-hidden
          >
            <div className="flex items-end gap-2 h-28">
              {[40, 55, 48, 62, 70, 58].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-secondary/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-[11px] text-neutral/60 mt-2 text-center">
              Illustrative, anonymized — not real adjudication stats
            </p>
          </div>
          <p className="text-sm text-neutral/80">
            While we build this, use{' '}
            <Link href="/status" className="link link-secondary font-medium">
              Status Update
            </Link>{' '}
            to share your timeline with your community.
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              What it does
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              Built for EB-5 investors
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2"
              >
                <h3 className="font-bold text-primary text-base">{f.title}</h3>
                <p className="text-sm text-neutral/75 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              Privacy &amp; security
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              Receipt numbers stay protected
            </h2>
            <p className="text-sm text-neutral/60 mt-2 leading-relaxed max-w-2xl">
              Designed so your receipt numbers are not shown to other investors or to EB5 Base
              staff in clear text.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-neutral/80">
            {PRIVACY_POINTS.map((point) => (
              <CheckItem key={point}>{point}</CheckItem>
            ))}
          </ul>
          <p className="text-sm text-neutral/80 pt-2">
            Read our{' '}
            <Link href="/privacy" className="link link-secondary">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="link link-secondary">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
