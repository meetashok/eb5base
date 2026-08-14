'use client';

import AnalysisShareButton from '@/components/analysis/AnalysisShareButton';
import {
  chartPathWithParams,
  sharePayloadToSearchParams,
  shareViewTitle,
  type I485SharePayload,
} from '@/lib/analysis/i485ShareParams';
import { SITE_URL } from '@/lib/constants';

export default function I485ShareButton({
  buildPayload,
  shareKey,
}: {
  buildPayload: () => I485SharePayload;
  shareKey?: string;
}) {
  return (
    <AnalysisShareButton
      buildPayload={buildPayload}
      shareKey={shareKey}
      endpoint="/api/analysis/i485/share"
      getShareTitle={(p) => shareViewTitle(p.view)}
      buildLongUrl={(p) => `${SITE_URL}${chartPathWithParams(p)}`}
      keyOf={(p) => sharePayloadToSearchParams(p).toString()}
    />
  );
}
