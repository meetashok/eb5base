'use client';

import AnalysisShareButton from '@/components/analysis/AnalysisShareButton';
import {
  chartPathWithParams,
  sharePayloadToSearchParams,
  shareViewTitle,
  type VisaBulletinSharePayload,
} from '@/lib/analysis/visaBulletinShareParams';
import { SITE_URL } from '@/lib/constants';

export default function VisaBulletinShareButton({
  buildPayload,
  shareKey,
}: {
  buildPayload: () => VisaBulletinSharePayload;
  shareKey?: string;
}) {
  return (
    <AnalysisShareButton
      buildPayload={buildPayload}
      shareKey={shareKey}
      endpoint="/api/analysis/visa-bulletin/share"
      getShareTitle={() => shareViewTitle()}
      buildLongUrl={(p) => `${SITE_URL}${chartPathWithParams(p)}`}
      keyOf={(p) => sharePayloadToSearchParams(p).toString()}
    />
  );
}
