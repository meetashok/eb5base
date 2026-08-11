'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PageHero from '@/components/PageHero';
import AboutTab from '@/components/nprm/AboutTab';
import CommentsTab from '@/components/nprm/CommentsTab';
import NprmTabBar from '@/components/nprm/NprmTabBar';
import OverviewTab from '@/components/nprm/OverviewTab';
import SummaryTab from '@/components/nprm/SummaryTab';
import WriteTab from '@/components/nprm/WriteTab';
import type { NprmPageData } from '@/lib/nprm/types';
import {
  NPRM_TABS,
  nprmTabHref,
  tabFromPathname,
  type NprmTabId,
} from '@/lib/nprm/tabs';
import GlossaryTerm from '@/components/nprm/GlossaryTerm';
import {
  DOCKET_URL,
  FR_PDF,
} from '@/lib/nprm/utils';

export type { NprmTabId } from '@/lib/nprm/tabs';
export { isNprmTabId, NPRM_TABS, nprmTabHref } from '@/lib/nprm/tabs';

const TAB_DOCUMENT_TITLE: Record<NprmTabId, string> = {
  overview: 'EB-5 NPRM 2026: Plain-English Guide to DHS Proposed Rule',
  summary: 'EB-5 NPRM Summary - Six Points That Matter',
  comments: 'NPRM Comments - Themes & Summaries',
  write: 'Build My EB-5 NPRM Comment',
  about: 'About the NPRM Comment Guide',
};

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
  const [writeSeed, setWriteSeed] = useState(0);
  const [writeTopics, setWriteTopics] = useState<string[]>([]);

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
    document.title = `${TAB_DOCUMENT_TITLE[active]} | EB5 Base`;
  }, [active]);

  const setTab = useCallback((id: NprmTabId, hash?: string) => {
    setActive(id);
    const base = nprmTabHref(id);
    const href = hash
      ? `${base}#${hash.replace(/^#/, '')}`
      : base;
    const current = `${window.location.pathname}${window.location.hash}`;
    if (current !== href) {
      // Update the URL without a Next.js route transition so the shell/nav
      // stay mounted and only the tab panel content swaps.
      window.history.pushState(null, '', href);
    }
    if (hash) {
      const clean = hash.replace(/^#/, '');
      window.requestAnimationFrame(() => {
        document.getElementById(clean)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, []);

  const goWrite = useCallback(() => {
    setWriteTopics([]);
    setWriteSeed((n) => n + 1);
    setTab('write');
  }, [setTab]);

  const goWriteWithTopic = useCallback((topicId: string) => {
    setWriteTopics([topicId]);
    setWriteSeed((n) => n + 1);
    setTab('write');
  }, [setTab]);

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
        title="The EB-5 Proposed Rule is Here"
        subtitle={
          <div className="space-y-1.5 text-sm md:text-[0.95rem] text-neutral max-w-2xl leading-relaxed">
            <p>
              <GlossaryTerm term="DHS" /> published a{' '}
              <a
                href={DOCKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                proposed rulemaking notice
              </a>{' '}
              on July 2, 2026. The draft finally codifies the EB-5{' '}
              <GlossaryTerm term="RIA" /> of 2022. EB5 Base breaks down the{' '}
              <a
                href={FR_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                358-page rule
              </a>{' '}
              in plain English for investors, and helps you build an LLM prompt
              you can use to write your public comment.
            </p>
            <p className="text-xs md:text-[0.8rem] text-neutral/75 leading-relaxed">
              <Link
                href="/about#disclaimer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Not legal advice
              </Link>
              .
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

      <NprmTabBar active={active} onSelect={setTab} />

      <div
        className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8"
        role="tabpanel"
        aria-labelledby={`nprm-tab-${active}`}
      >
        {active === 'summary' && (
          <SummaryTab onWriteTopic={goWriteWithTopic} />
        )}
        {active === 'comments' && (
          <CommentsTab
            comments={data.comments}
            themes={data.themes}
            lastPull={data.stats.last_pull}
            totalComments={data.stats.total_comments}
            onAbout={() => setTab('about')}
          />
        )}
        {active === 'write' && (
          <WriteTab
            key={writeSeed}
            initialTopicIds={writeTopics}
            onSummary={(hash) => setTab('summary', hash)}
          />
        )}
        {active === 'about' && (
          <AboutTab
            checkLog={data.checkLog}
            lastPull={data.stats.last_pull}
            totalComments={data.stats.total_comments}
            proposal={data.proposal}
            onWrite={goWrite}
          />
        )}
        {active === 'overview' && (
          <OverviewTab
            stats={data.stats}
            comments={data.comments}
            proposal={data.proposal}
            onWrite={goWrite}
            onWriteTopic={goWriteWithTopic}
            onSummary={(hash) => setTab('summary', hash)}
            onComments={() => setTab('comments')}
          />
        )}
      </div>
    </div>
  );
}
