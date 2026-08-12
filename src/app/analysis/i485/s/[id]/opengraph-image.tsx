import {
  shareFilterSummary,
  shareViewTitle,
} from '@/lib/analysis/i485ShareParams';
import { fetchI485Share } from '@/lib/analysis/i485ShareStore';
import { createI485ShareOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og';

export const runtime = 'nodejs';
export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;
export const alt = 'EB5 Base I-485 inventory share';
export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

function viewLabel(view: string): string {
  if (view === 'compare') return 'Compare';
  if (view === 'cohort') return 'Priority date';
  return 'Inventory';
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const share = await fetchI485Share(id);
  if (!share) {
    return createI485ShareOgImage({
      title: 'I-485 pending inventory',
      filterLine: 'Shared chart link',
      viewLabel: 'Analysis',
    });
  }
  return createI485ShareOgImage({
    title: shareViewTitle(share.payload.view),
    filterLine: shareFilterSummary(share.payload),
    viewLabel: viewLabel(share.payload.view),
  });
}
