import { GlossaryText } from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { COMMENT_ON_URL } from '@/lib/nprm/utils';

const HOW_IT_WORKS =
  'Agencies publish a draft, you submit a comment on regulations.gov with docket USCIS-2026-0100 explaining your concern, data, and a better approach if you have one. The agency reads all comments before issuing a final rule. A clear personal experience with specific section numbers is useful.';

/** Overview process card: how the NPRM comment loop works. */
export default function HowCommentingWorks({ onWrite }: { onWrite: () => void }) {
  return (
    <section
      id="how-commenting-works"
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-3 scroll-mt-28"
    >
      <NprmSectionHeading
        as="h3"
        eyebrow="Process"
        title="How commenting works"
        titleClassName="text-sm font-bold text-primary leading-snug"
      />
      <p className="text-sm text-neutral leading-relaxed">
        <GlossaryText text={HOW_IT_WORKS} />
      </p>
      <p className="text-xs text-neutral/80 leading-relaxed">
        <GlossaryText text="If enough investors flag the same data gap, USCIS must publish a reasoned response or risk reversal on judicial review under the APA. File on " />
        <a
          href={COMMENT_ON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-secondary underline underline-offset-2"
        >
          regulations.gov
        </a>
        .
      </p>
      <div className="pt-1">
        <button
          type="button"
          onClick={onWrite}
          data-goatcounter-click="nprm-build-comment"
          className="btn btn-primary text-primary-content"
        >
          Build My Comment
        </button>
      </div>
    </section>
  );
}
