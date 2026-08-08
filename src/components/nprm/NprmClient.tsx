'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AboutTab from '@/components/nprm/AboutTab';
import CommentsTab from '@/components/nprm/CommentsTab';
import OverviewTab from '@/components/nprm/OverviewTab';
import ThemesTab from '@/components/nprm/ThemesTab';
import WriteTab from '@/components/nprm/WriteTab';
import type { NprmPageData } from '@/lib/nprm/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'themes', label: 'Themes' },
  { id: 'comments', label: 'Comments' },
  { id: 'write', label: 'Write' },
  { id: 'about', label: 'About' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTabId(v: string | null): v is TabId {
  return !!v && TABS.some((t) => t.id === v);
}

export default function NprmClient({ data }: { data: NprmPageData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [, startTransition] = useTransition();

  const [active, setActive] = useState<TabId>(() =>
    isTabId(tabParam) ? tabParam : 'overview'
  );
  const [selectedOpinions, setSelectedOpinions] = useState<
    Record<string, string>
  >({});
  const [writeSeed, setWriteSeed] = useState(0);
  const [writeThemes, setWriteThemes] = useState<string[]>([]);
  const [writeOpinions, setWriteOpinions] = useState<Record<string, string>>(
    {}
  );

  // Sync from URL (back/forward, deep links) without blocking paint.
  useEffect(() => {
    const next = isTabId(tabParam) ? tabParam : 'overview';
    setActive(next);
  }, [tabParam]);

  const setTab = useCallback(
    (id: TabId) => {
      setActive(id); // immediate UI
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (id === 'overview') params.delete('tab');
        else params.set('tab', id);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

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

  return (
    <div className="pb-16">
      <div className="border-b-2 border-base-300 bg-base-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div
            role="tablist"
            aria-label="EB-5 proposed rule sections"
            className="flex gap-1 overflow-x-auto py-2.5 -mx-1 px-1"
          >
            {TABS.map((tab) => {
              const selected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`nprm-tab-${tab.id}`}
                  className={`shrink-0 px-3.5 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 ${
                    selected
                      ? 'bg-primary text-primary-content shadow-soft'
                      : 'text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary'
                  }`}
                  onClick={() => setTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8"
        role="tabpanel"
        aria-labelledby={`nprm-tab-${active}`}
      >
        {active === 'themes' && (
          <ThemesTab
            themes={data.themes}
            selectedOpinions={selectedOpinions}
            onSelectOpinion={onSelectOpinion}
            onWriteWithTheme={goWriteWithTheme}
          />
        )}
        {active === 'comments' && (
          <CommentsTab comments={data.comments} themes={data.themes} />
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
          />
        )}
        {active === 'overview' && (
          <OverviewTab
            stats={data.stats}
            themes={data.themes}
            comments={data.comments}
            lastCheck={data.lastCheck}
            feedSource={data.feedSource}
            onWrite={() => setTab('write')}
            onAbout={() => setTab('about')}
          />
        )}
      </div>
    </div>
  );
}
