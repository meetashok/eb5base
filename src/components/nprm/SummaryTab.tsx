'use client';

import { useEffect } from 'react';
import { ExternalExplainerSection } from '@/components/nprm/ExternalExplainers';
import { GlossaryText } from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import {
  KEY_TOPICS,
  stancesByPolarity,
  topicSectionId,
} from '@/lib/nprm/keyTopics';
import type { KeyTopic, KeyTopicStance } from '@/lib/nprm/types';
import { FR_HTML, FR_PDF } from '@/lib/nprm/utils';

function StanceBlock({ stance }: { stance: KeyTopicStance }) {
  return (
    <div className="space-y-2 rounded-lg border border-base-300/80 bg-base-100/80 p-3">
      <p className="text-sm font-semibold text-primary leading-snug">
        <GlossaryText text={stance.label} />
      </p>
      <ul className="list-disc pl-4 space-y-1 text-sm text-neutral leading-relaxed">
        {stance.angles.map((a) => (
          <li key={a}>
            <GlossaryText text={a} />
          </li>
        ))}
      </ul>
      <div className="grid sm:grid-cols-2 gap-3 pt-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary mb-1">
            Pros
          </p>
          <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-neutral leading-relaxed">
            {stance.pros.map((p) => (
              <li key={p}>
                <GlossaryText text={p} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral/70 mb-1">
            Cons
          </p>
          <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-neutral leading-relaxed">
            {stance.cons.map((c) => (
              <li key={c}>
                <GlossaryText text={c} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PolaritySection({
  topic,
  polarity,
  title,
}: {
  topic: KeyTopic;
  polarity: 'agree' | 'disagree';
  title: string;
}) {
  const stances = stancesByPolarity(topic, polarity);
  if (!stances.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">{title}</p>
      <div className="space-y-3">
        {stances.map((s) => (
          <StanceBlock key={s.id} stance={s} />
        ))}
      </div>
    </div>
  );
}

export default function SummaryTab({
  onWriteTopic,
}: {
  onWriteTopic: (topicId: string) => void;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] space-y-8">
      <div className="mb-0 max-w-2xl">
        <NprmSectionHeading
          as="h2"
          eyebrow="Summary"
          title={<GlossaryText text="The six points that actually matter" />}
        >
          <p className="text-sm text-neutral leading-relaxed">
            Same topics as Overview Key points, with more detail and honest
            pros and cons for each comment angle. Verify everything on the{' '}
            <a
              href={FR_HTML}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              Federal Register
            </a>{' '}
            (
            <a
              href={FR_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              PDF
            </a>
            ).
          </p>
        </NprmSectionHeading>
      </div>

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8 items-start">
        <nav
          aria-label="Summary topics"
          className="hidden lg:block sticky top-[calc(var(--site-sticky-offset)+3.5rem)] space-y-1 text-sm"
        >
          {KEY_TOPICS.map((t, idx) => (
            <a
              key={t.id}
              href={`#${topicSectionId(t.id)}`}
              className="block rounded-md px-2 py-1.5 text-neutral hover:bg-base-200 hover:text-primary font-medium"
            >
              <span className="text-secondary tabular-nums mr-1">{idx + 1}.</span>
              {t.title.length > 42 ? `${t.title.slice(0, 40)}…` : t.title}
            </a>
          ))}
        </nav>

        <div className="space-y-6 max-w-3xl">
          <div className="lg:hidden flex flex-wrap gap-2 pb-1">
            {KEY_TOPICS.map((t, idx) => (
              <a
                key={t.id}
                href={`#${topicSectionId(t.id)}`}
                className="rounded-md border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-neutral"
              >
                {idx + 1}. {t.title.split(',')[0]}
              </a>
            ))}
          </div>

          {KEY_TOPICS.map((topic, idx) => (
            <article
              key={topic.id}
              id={topicSectionId(topic.id)}
              className="scroll-mt-36 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4"
            >
              <NprmSectionHeading
                as="h3"
                eyebrow={`Topic ${idx + 1}`}
                title={<GlossaryText text={topic.title} />}
              />
              <p className="text-sm text-neutral leading-relaxed">
                <GlossaryText text={topic.summary.overview} />
              </p>
              {(topic.summary.current || topic.summary.proposed) && (
                <dl className="space-y-2 text-sm text-neutral leading-relaxed">
                  {topic.summary.current ? (
                    <div>
                      <dt className="font-bold text-primary">Today</dt>
                      <dd>
                        <GlossaryText text={topic.summary.current} />
                      </dd>
                    </div>
                  ) : null}
                  {topic.summary.proposed ? (
                    <div>
                      <dt className="font-bold text-primary">Proposed</dt>
                      <dd>
                        <GlossaryText text={topic.summary.proposed} />
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}

              <PolaritySection
                topic={topic}
                polarity="agree"
                title="If you generally agree with the draft"
              />
              <PolaritySection
                topic={topic}
                polarity="disagree"
                title="If you generally disagree with the draft"
              />

              <div className="flex flex-col items-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onWriteTopic(topic.id)}
                  data-goatcounter-click="nprm-build-comment"
                  className="btn btn-primary btn-sm text-primary-content"
                >
                  Build a comment on this
                </button>
                <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] leading-snug">
                  <a
                    href={`${FR_HTML}#${topic.frHeadingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal text-secondary underline underline-offset-2 hover:text-primary"
                  >
                    Read {topic.frSectionLabel} in the Federal Register
                  </a>
                  <span className="text-neutral/50" aria-hidden="true">
                    ·
                  </span>
                  <a
                    href={FR_PDF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal text-secondary underline underline-offset-2 hover:text-primary"
                  >
                    PDF
                  </a>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <ExternalExplainerSection />
    </div>
  );
}
