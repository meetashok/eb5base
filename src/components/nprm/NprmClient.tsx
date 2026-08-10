'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PageHero from '@/components/PageHero';
import AboutTab from '@/components/nprm/AboutTab';
import CommentsTab from '@/components/nprm/CommentsTab';
import NprmTabBar from '@/components/nprm/NprmTabBar';
import OverviewTab from '@/components/nprm/OverviewTab';
import SummaryTab from '@/components/nprm/SummaryTab';
import ThemesTab from '@/components/nprm/ThemesTab';
import WriteTab from '@/components/nprm/WriteTab';
import type { NprmPageData } from '@/lib/nprm/types';
import { nprmDocumentTitle } from '@/lib/nprm/metadata';
import {
  NPRM_TABS,
  nprmTabHref,
  tabFromPathname,
  type NprmTabId,
} from '@/lib/nprm/tabs';
import { DOCKET_URL, FR_HTML, NPRM_LAST_UPDATED } from '@/lib/nprm/utils';

export type { NprmTabId } from '@/lib/nprm/tabs';
export { isNprmTabId, NPRM_TABS, nprmTabHref } from '@/lib/nprm/tabs';

function tabLabel(tab: NprmTabId): string {
  return NPRM_TABS.find((t) => t.id === tab)?.label || 'Overview';
}

export default function NprmClient({
  data,
  tab,
}: {
  data: NprmPageData;
  tab: NprmTabId;
}) {
  const [active, setActive] = useState<NprmTabId>(tab);
  const [selectedOpinions, setSelectedOpinions] = useState<
    Record<string, string>
  >({});
  const [writeSeed, setWriteSeed] = useState(0);
  const [writeThemes, setWriteThemes] = useState<string[]>([]);
  const [writeOpinions, setWriteOpinions] = useState<Record<string, string>>(
    {}
  );

  // Keep client tab in sync with browser history (back/forward, deep links).
  useEffect(() => {
    const syncFromLocation = () => {
      setActive(tabFromPathname(window.location.pathname) || tab);
    };
    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [tab]);

  useEffect(() => {
    document.title = `${nprmDocumentTitle(active)} | EB5 Base`;
  }, [active]);

  const setTab = useCallback((id: NprmTabId) => {
    setActive(id);
    const href = nprmTabHref(id);
    if (window.location.pathname !== href) {
      // Update the URL without a Next.js route transition so the shell/nav
      // stay mounted and only the tab panel content swaps.
      window.history.pushState(null, '', href);
    }
  }, []);

  const onSelectOpinion = (themeId: string, opinionId: string) => {
    setSelectedOpinions((prev) => ({ ...prev, [themeId]: opinionId }));
  };

  const goWriteWithTheme = (themeId: string, opinionId: string) => {
    setWriteThemes([themeId]);
    setWriteOpinions({ [themeId]: opinionId });
    setSelectedOpinions((prev) => ({ ...prev, [themeId]: opinionId }));
    setWriteSeed((n) => n + 1);
    setTab('write');
  };

  const current = tabLabel(active);

  return (
    <div className="pb-16">
      <PageHero
        eyebrow={
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline underline-offset-4 decoration-secondary/50"
          >
            Docket USCIS-2026-0100
            <span className="text-[10px] font-semibold normal-case tracking-normal opacity-80">
              ↗ regulations.gov
            </span>
          </a>
        }
        title="A draft of new EB-5 house rules"
        subtitle={
          <div className="space-y-1.5 text-sm md:text-[0.95rem] text-neutral max-w-2xl leading-relaxed">
            <p>
              DHS published a 358-page draft on July 2, 2026 to apply the 2022
              law called RIA. It is not final. You can comment before August 31,
              2026. This site explains it in plain English with links back to
              official pages.
            </p>
            <p>
              Last data updated: {NPRM_LAST_UPDATED} ·{' '}
              <a
                href={FR_HTML}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary underline underline-offset-2"
              >
                Federal Register
              </a>
              {' · '}
              <Link
                href="/about#disclaimer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Not legal advice
              </Link>
            </p>
          </div>
        }
      />

      <nav
        aria-label="Breadcrumb"
        className="max-w-6xl mx-auto px-4 pt-4 pb-1 text-xs sm:text-sm text-neutral/70"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-secondary underline-offset-2 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden className="opacity-50">
            /
          </li>
          <li>
            <button
              type="button"
              onClick={() => setTab('overview')}
              className="hover:text-secondary underline-offset-2 hover:underline"
            >
              NPRM
            </button>
          </li>
          {active !== 'overview' ? (
            <>
              <li aria-hidden className="opacity-50">
                /
              </li>
              <li className="font-semibold text-primary" aria-current="page">
                {current}
              </li>
            </>
          ) : (
            <li className="sr-only" aria-current="page">
              Overview
            </li>
          )}
        </ol>
      </nav>

      <div className="border-b border-base-300/80 bg-base-100">
        <div className="max-w-6xl mx-auto px-4">
          <ol className="flex flex-wrap gap-x-3 gap-y-1 py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral/60">
            {[
              { n: 1, label: 'Understand', tabs: ['overview', 'summary'] },
              { n: 2, label: 'Themes', tabs: ['themes', 'comments'] },
              { n: 3, label: 'Personalize', tabs: ['write'] },
              { n: 4, label: 'Submit', tabs: ['write'] },
            ].map((step) => {
              const on =
                step.tabs.includes(active) ||
                (step.n === 4 && active === 'write');
              return (
                <li
                  key={step.n}
                  className={on ? 'text-secondary' : undefined}
                  aria-current={on ? 'step' : undefined}
                >
                  <span className="tabular-nums">{step.n}.</span> {step.label}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <NprmTabBar active={active} onSelect={setTab} />

      <div
        className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8"
        role="tabpanel"
        aria-labelledby={`nprm-tab-${active}`}
      >
        {active === 'summary' && <SummaryTab />}
        {active === 'themes' && (
          <ThemesTab
            themes={data.themes}
            selectedOpinions={selectedOpinions}
            onSelectOpinion={onSelectOpinion}
            onWriteWithTheme={goWriteWithTheme}
          />
        )}
        {active === 'comments' && (
          <CommentsTab
            comments={data.comments}
            themes={data.themes}
            lastPull={data.stats.last_pull}
          />
        )}
        {active === 'write' && (
          <WriteTab
            key={writeSeed}
            themes={data.themes}
            promptTree={data.promptTree}
            initialThemeIds={writeThemes}
            initialOpinions={writeOpinions}
          />
        )}
        {active === 'about' && (
          <AboutTab
            checkLog={data.checkLog}
            lastPull={data.stats.last_pull}
            totalComments={data.stats.total_comments}
            proposal={data.proposal}
          />
        )}
        {active === 'overview' && (
          <OverviewTab
            stats={data.stats}
            comments={data.comments}
            proposal={data.proposal}
            lastCheck={data.lastCheck}
            feedSource={data.feedSource}
            onThemes={() => setTab('themes')}
            onComments={() => setTab('comments')}
            onWrite={() => setTab('write')}
            onSummary={() => setTab('summary')}
            onAbout={() => setTab('about')}
          />
        )}
      </div>
    </div>
  );
}
