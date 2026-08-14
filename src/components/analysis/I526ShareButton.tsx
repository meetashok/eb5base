'use client';

import AnalysisShareButton from '@/components/analysis/AnalysisShareButton';
import {
  chartPathWithParams,
  sharePayloadToSearchParams,
  shareViewTitle,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';
import { SITE_URL } from '@/lib/constants';

export default function I526ShareButton({
  buildPayload,
  shareKey,
}: {
  buildPayload: () => I526SharePayload;
  shareKey?: string;
}) {
  return (
    <AnalysisShareButton
      buildPayload={buildPayload}
      shareKey={shareKey}
      endpoint="/api/analysis/i526/share"
      getShareTitle={(p) => shareViewTitle(p.view)}
      buildLongUrl={(p) => `${SITE_URL}${chartPathWithParams(p)}`}
      keyOf={(p) => sharePayloadToSearchParams(p).toString()}
    />
  );
}
