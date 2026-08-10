import GlossaryTerm from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { COMMENT_IMPACT_SOURCES } from '@/lib/nprm/constants';

/** Short evidence block: comments can change final rules. */
export default function DoCommentsChangeRule() {
  return (
    <section
      id="do-comments-change-the-rule"
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-2 scroll-mt-28"
    >
      <NprmSectionHeading
        as="h3"
        eyebrow="Impact"
        title="Do comments change the rule?"
        titleClassName="text-sm font-bold text-primary leading-snug"
      />
      <p className="text-sm text-neutral leading-relaxed">
        Often yes on specifics, but it is not a vote. The{' '}
        <GlossaryTerm term="APA" /> and court doctrine require agencies to
        consider significant comments. A <GlossaryTerm term="GAO" /> survey found
        most program offices reported that comments led to substantive changes
        in final rules. The Office of the Federal Register says persuasive
        comments can change a proposal. In the last major EB-5 modernization
        (2019), <GlossaryTerm term="DHS" /> answered hundreds of comments and
        lowered the proposed <GlossaryTerm term="TEA" /> investment amount from
        $1.35M to $900K. Unique investor stories help put concrete harms on the
        record so they must be addressed, especially if other voices push only
        to tighten the program.
      </p>
      <p className="text-xs text-neutral/80 leading-relaxed">
        Sources:{' '}
        {COMMENT_IMPACT_SOURCES.map((s, i) => (
          <span key={s.id}>
            {i > 0 ? <span className="text-neutral/40"> · </span> : null}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              {s.label}
            </a>
          </span>
        ))}
        .
      </p>
    </section>
  );
}
