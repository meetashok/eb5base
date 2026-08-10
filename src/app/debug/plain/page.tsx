export const dynamic = 'force-static';

export const metadata = {
  title: 'NPRM plain summary (debug)',
  description:
    'Plain HTML NPRM explainer for crawler and readability testing. Not linked from main nav.',
  robots: { index: false, follow: false },
};

export default function NprmPlainDebugPage() {
  return (
    <main
      style={{
        maxWidth: 680,
        margin: '2rem auto',
        padding: '0 1rem 3rem',
        fontFamily: 'Georgia, "Times New Roman", serif',
        lineHeight: 1.7,
        fontSize: 18,
        color: '#1a1a1a',
      }}
    >
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
        <a href="/debug/crawl">Crawl checklist</a> · <a href="/nprm">Full NPRM guide</a>
      </p>
      <h1 style={{ fontSize: 28, lineHeight: 1.25 }}>
        What is this NPRM? A draft of new EB-5 house rules
      </h1>
      <p>
        <strong>TLDR:</strong> This is a draft of new EB-5 rules. It is not final.
        You can tell the agency what you think before August 31, 2026.
      </p>
      <p>
        Think of EB-5 as an apartment building. Congress passed a renovation law in
        2022 (the RIA). USCIS has been enforcing those rules with memos. On July 2,
        2026 it published a 358-page formal draft rulebook. After the comment period,
        it will publish a final rule.
      </p>
      <h2 style={{ fontSize: 22 }}>Why you should care</h2>
      <ol>
        <li>When you can get your money back (about 2 years vs a long green-card wait)</li>
        <li>What happens if your regional center closes (keeping your place in line)</li>
        <li>How much future investors pay ($800K stays for now; new $1.4M tier proposed)</li>
      </ol>
      <h2 style={{ fontSize: 22 }}>Do I need to act before August 31?</h2>
      <p>
        If you already filed: you do not have to comment, but a personal comment can
        help protect your investment. If you plan to file: pay attention to amounts
        and the Jan 1, 2027 inflation adjustment.
      </p>
      <p>
        Action: read the guide at <a href="/nprm">/nprm</a>, then draft a comment and
        file it yourself on regulations.gov. Do not include your A-Number.
      </p>
      <h2 style={{ fontSize: 22 }}>Legal reference</h2>
      <p style={{ fontSize: 14, color: '#555' }}>
        Docket USCIS-2026-0100 · FR Doc 2026-13392 · comments close August 31, 2026.
        This page is for crawler testing. Not legal advice.
      </p>
    </main>
  );
}
