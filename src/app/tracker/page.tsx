import Link from 'next/link';
import { redirect } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';
import CaseTrackerWaitlistForm from '@/components/CaseTrackerWaitlistForm';
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

  return (
    <div>
      <PageHero
        eyebrow={<span>Case Tracker · Coming soon</span>}
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
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            Case Tracker is coming soon
          </h2>
          <p className="text-sm text-neutral/70 max-w-xl mx-auto leading-relaxed">
            We are finishing encrypted receipt tracking, alerts, and cohort insights. Join the
            waitlist below and use Status Update meanwhile to share milestones with your community.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            <span
              className="btn btn-accent text-accent-content rounded-full px-8 opacity-80 cursor-not-allowed pointer-events-none"
              aria-disabled="true"
            >
              Coming soon
            </span>
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
              Leave your email and we will notify you once when Case Tracker is ready for broader
              use. No ads, no marketing list.
            </p>
          </div>
          <CaseTrackerWaitlistForm
            source="tracker"
            variant="full"
            inputId="tracker-waitlist-email"
          />
          <p className="text-xs text-neutral/60 leading-relaxed">
            By submitting, you agree we may store your email for this one-time launch notice.{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-secondary">
              Privacy
            </Link>
            .
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              Vision
            </p>
            <h2 className="text-xl font-bold text-primary">
              See where your case sits in your project cohort
            </h2>
            <p className="text-sm text-neutral/70 mt-1 leading-relaxed max-w-2xl">
              Example chart concept: I-526E approval-time distribution for your project (opt-in,
              anonymized). The curve shows how long similar filings took. Markers show the median
              and where you land.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-base-300 bg-base-200/40 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                Sample project · I-526E approval time
              </p>
              <p className="text-[11px] text-neutral/60">Illustrative only · not live data</p>
            </div>

            <div className="relative pt-8 pb-2">
              {/* Callouts above the chart */}
              <div className="absolute top-0 left-[42%] -translate-x-1/2 max-w-[9.5rem] text-center">
                <p className="text-[10px] sm:text-[11px] font-semibold text-primary leading-snug">
                  50% approved within 8 months
                </p>
              </div>
              <div className="absolute top-0 left-[28%] -translate-x-1/2 max-w-[8.5rem] text-center hidden sm:block">
                <p className="text-[10px] sm:text-[11px] font-semibold text-secondary leading-snug">
                  Your case · top 25%
                </p>
              </div>

              <svg
                viewBox="0 0 400 155"
                className="w-full h-auto text-secondary"
                role="img"
                aria-label="Illustrative distribution: half of sample I-526E cases approved by 8 months; example case in top 25 percent at 6 months"
              >
                {/* Distribution area */}
                <path
                  d="M20 120 C 60 118, 80 110, 100 85 C 120 55, 130 35, 150 28 C 170 22, 185 30, 200 48 C 220 75, 240 95, 270 108 C 300 118, 340 120, 380 122 L 380 130 L 20 130 Z"
                  fill="currentColor"
                  opacity="0.22"
                />
                <path
                  d="M20 120 C 60 118, 80 110, 100 85 C 120 55, 130 35, 150 28 C 170 22, 185 30, 200 48 C 220 75, 240 95, 270 108 C 300 118, 340 120, 380 122"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.55"
                />

                {/* Median line at ~8 months (x≈168) */}
                <line
                  x1="168"
                  y1="18"
                  x2="168"
                  y2="130"
                  stroke="#0a1628"
                  strokeWidth="1.75"
                  strokeDasharray="4 3"
                />
                {/* Your case at ~6 months / top 25% (x≈112) */}
                <line
                  x1="112"
                  y1="18"
                  x2="112"
                  y2="130"
                  stroke="#2d5a47"
                  strokeWidth="2"
                />
                <circle cx="112" cy="70" r="4.5" fill="#2d5a47" />

                {/* X axis */}
                <line x1="20" y1="130" x2="380" y2="130" stroke="#2c3338" strokeOpacity="0.25" />
                <text x="20" y="148" fontSize="10" fill="#2c3338" fillOpacity="0.55">
                  0 mo
                </text>
                <text x="155" y="148" fontSize="10" fill="#2c3338" fillOpacity="0.55">
                  8 mo
                </text>
                <text x="250" y="148" fontSize="10" fill="#2c3338" fillOpacity="0.55">
                  12 mo
                </text>
                <text x="345" y="148" fontSize="10" fill="#2c3338" fillOpacity="0.55">
                  18+ mo
                </text>
              </svg>

              <p className="sm:hidden text-[11px] font-semibold text-secondary text-center">
                Your case · top 25% (faster than most in this sample)
              </p>
            </div>

            <ul className="grid sm:grid-cols-2 gap-2 text-xs text-neutral/75 leading-relaxed">
              <li>
                <span className="font-semibold text-primary">Median (50%):</span> half of similar
                filings in this sample were approved by month 8.
              </li>
              <li>
                <span className="font-semibold text-secondary">Your marker:</span> example case at
                month 6, in the fastest quarter of the cohort.
              </li>
            </ul>
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
              <BrandWordmark variant="on-light" className="font-semibold" /> takes privacy
              seriously. That is why we take great care so your receipt numbers are not exposed to
              other investors or to EB5 Base staff in clear text.
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
