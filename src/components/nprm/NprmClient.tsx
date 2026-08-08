'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AboutTab from '@/components/nprm/AboutTab';
import CommentsTab from '@/components/nprm/CommentsTab';
import OverviewTab from '@/components/nprm/OverviewTab';
import ThemesTab from '@/components/nprm/ThemesTab';
import WriteTab from '@/components/nprm/WriteTab';
import type { NprmPageData } from '@/lib/nprm/types';
import {
  NPRM_TABS,
  nprmTabHref,
  tabFromPathname,
  type NprmTabId,
} from '@/lib/nprm/tabs';

export type { NprmTabId } from '@/lib/nprm/tabs';
export { isNprmTabId, NPRM_TABS, nprmTabHref } from '@/lib/nprm/tabs';

export default function NprmClient({
  data,
  tab,
}: {
  data: NprmPageData;
  tab: NprmTabId;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [active, setActive] = useState<NprmTabId>(tab);
  const [selectedOpinions, setSelectedOpinions] = useState<
    Record<string, string>
  >({});
  const [writeSeed, setWriteSeed] = useState(0);
  const [writeThemes, setWriteThemes] = useState<string[]>([]);
  const [writeOpinions, setWriteOpinions] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    setActive(tabFromPathname(pathname) || tab);
  }, [pathname, tab]);

  const setTab = useCallback(
    (id: NprmTabId) => {
      setActive(id);
      startTransition(() => {
        router.replace(nprmTabHref(id), { scroll: false });
      });
    },
    [router, startTransition]
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
            {NPRM_TABS.map((t) => {
              const selected = active === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`nprm-tab-${t.id}`}
                  className={`shrink-0 px-3.5 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 ${
                    selected
                      ? 'bg-primary text-primary-content shadow-soft'
                      : 'text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary'
                  }`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
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
