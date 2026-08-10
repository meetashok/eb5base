import GlossaryTerm from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { COMMENT_IMPACT_SOURCES } from '@/lib/nprm/constants';

/** Short evidence block: comments can change final rules. */
export default function DoCommentsChangeRule() {
  return (
    <section
      id="do-comments-change-the-rule"
      className="rounded-xl border-2 border-secondary/30 bg-secondary/[0.05] p-4 sm:p-5 shadow-soft space-y-3 scroll-mt-28"
    >
      <NprmSectionHeading
        as="h3"
        eyebrow="Your voice"
        title="Your comment can change what gets finalized"
        titleClassName="text-base font-bold text-primary leading-snug"
      />
      <p className="text-sm text-neutral leading-relaxed">
        Yes: investor comments have moved EB-5 before. In the last major
        modernization (2019), <GlossaryTerm term="DHS" /> answered hundreds of
        comments{' '}
        and{' '}
        <strong className="font-bold text-primary">
          lowered the proposed <GlossaryTerm term="TEA" /> amount from $1.35M to
          $900K
        </strong>
        . That is real money for families. Because investors spoke up before the
        rule was final.
      </p>
      <p className="text-sm text-neutral leading-relaxed">
        Agencies must consider significant comments under the{' '}
        <GlossaryTerm term="APA" />. A <GlossaryTerm term="GAO" /> survey found
        most program offices reported that comments led to substantive changes
        in final rules, and the Office of the Federal Register says persuasive
        comments can reshape a proposal. Even though this is not a vote, unique
        investor stories put concrete harms on the record so they must be
        addressed, especially when other voices push only to tighten the
        program.
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
