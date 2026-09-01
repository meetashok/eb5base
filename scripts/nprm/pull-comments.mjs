#!/usr/bin/env node
/**
 * Pull NPRM comments from regulations.gov (api.data.gov) and write first-party
 * JSON under public/data/nprm/. No Meta feed. API key via REGULATIONS_GOV_API_KEY.
 *
 * Usage:
 *   REGULATIONS_GOV_API_KEY=... node scripts/nprm/pull-comments.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public/data/nprm');
const DOCUMENT_ID = 'USCIS-2026-0100-0001';
const DOCKET_ID = 'USCIS-2026-0100';
const API = 'https://api.regulations.gov/v4';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvFile(path.join(ROOT, '.env.local'));
loadEnvFile(path.join(ROOT, '.env'));

const API_KEY = process.env.REGULATIONS_GOV_API_KEY || process.env.DATA_GOV_API_KEY;
if (!API_KEY) {
  console.error('Missing REGULATIONS_GOV_API_KEY (or DATA_GOV_API_KEY)');
  process.exit(1);
}

const THEME_RULES = [
  {
    id: 'sustainment',
    title: 'Capital back after about 2 years',
    patterns: [
      /\bsustainment\b/i,
      /\b2[ -]?year\b/i,
      /\bredeploy/i,
      /\bat[- ]risk\b/i,
      /\breturn of capital\b/i,
      /\bmade available to the jce\b/i,
    ],
  },
  {
    id: 'bridge_financing',
    title: 'Bridge financing and your 10 jobs',
    patterns: [/\bbridge financ/i, /\bbridge loan\b/i, /\brepaid bridge\b/i],
  },
  {
    id: 'good_faith',
    title: 'If your regional center fails',
    patterns: [
      /\bgood[- ]faith\b/i,
      /\b180[ -]?day\b/i,
      /\bi-?527\b/i,
      /\bterminat(?:e|ion|ed)\b/i,
      /\bre-?associat/i,
      /\bdebar/i,
    ],
  },
  {
    id: 'investment_amounts',
    title: '$800K, $1.4M tier, and 2027 hike',
    patterns: [
      /\$?\s*800\s*,?\s*000\b/i,
      /\$?\s*1\.?05\s*m/i,
      /\$?\s*1\.?4\s*m/i,
      /\binflation\b/i,
      /\bminimum investment\b/i,
      /\bhea\b/i,
    ],
  },
  {
    id: 'tea',
    title: 'Who decides TEA / $800K eligibility',
    patterns: [
      /\btea\b/i,
      /\btargeted employment\b/i,
      /\bhigh[- ]unemployment\b/i,
      /\bcensus tract\b/i,
    ],
  },
  {
    id: 'sanctions',
    title: 'Audits and fines for regional centers',
    patterns: [
      /\baudits?\b/i,
      /\bsanctions?\b/i,
      /\bfines?\b/i,
      /\bsite visits?\b/i,
      /\bpenalt(?:y|ies)\b/i,
      /\bdebarment\b/i,
    ],
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGet(urlPath) {
  const url = new URL(urlPath.startsWith('http') ? urlPath : `${API}${urlPath}`);
  url.searchParams.set('api_key', API_KEY);
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.api+json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${url.pathname}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '-')
    .replace(/&ndash;/gi, '-')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function stripEmDash(s) {
  return String(s || '')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function posterFromTitle(title) {
  const m = String(title || '').match(/^Comment Submitted by\s+(.+)$/i);
  const name = (m?.[1] || title || '').trim().replace(/\.$/, '');
  const lower = name.toLowerCase();
  if (!name || lower === 'anonymous' || lower.startsWith('anonymous ')) {
    return { posterType: 'anonymous', rawName: '' };
  }
  if (
    /\b(llc|inc\.?|ltd|limited|corp\.?|corporation|company|capital|management|partners|lp|llp|plc|gmbh|p\.?c\.?|association|foundation|university|bank)\b/i.test(
      name
    )
  ) {
    return { posterType: 'org', rawName: name };
  }
  return { posterType: 'named', rawName: name };
}

function posterLabel(posterType) {
  if (posterType === 'org') return 'Organization';
  if (posterType === 'named') return 'Named person';
  return 'Anonymous';
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function anonymizeText(text, rawName) {
  let out = decodeEntities(text);
  if (rawName) {
    const parts = rawName.split(/\s+/).filter((p) => p.length > 2);
    for (const part of [rawName, ...parts]) {
      out = out.replace(new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi'), '');
    }
  }
  out = out
    .replace(/\b(I|we)\s+(am|are)\s+submitting\s+this\s+comment[^.]*\./gi, '')
    .replace(/\bmy name is[^.]*\./gi, '')
    .replace(/\bAs an EB-5 investor[, ]+/gi, '')
    .replace(/\bInvestor\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(argues|supports|requests|comments)/gi, 'This comment $1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripEmDash(out);
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

function pickTheme(text) {
  let best = null;
  let bestScore = 0;
  for (const rule of THEME_RULES) {
    let score = 0;
    for (const p of rule.patterns) {
      if (p.test(text)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (!best || bestScore < 1) return { theme_id: null, theme_title: null };
  return { theme_id: best.id, theme_title: best.title };
}

function buildAiSummary(body, posterType, rawName) {
  const cleaned = anonymizeText(body, rawName);
  const lower = cleaned.toLowerCase();
  if (
    !cleaned ||
    cleaned.length < 40 ||
    /see attached/i.test(cleaned) ||
    /please see attached/i.test(cleaned)
  ) {
    return 'This comment includes an attachment on regulations.gov. Open the filing to read the full text; no separate body text was posted in the API.';
  }

  // Prefer substantive sentences; skip salutation / docket header lines.
  const picks = sentences(cleaned)
    .filter((s) => {
      const l = s.toLowerCase();
      if (/^dear\b/.test(l)) return false;
      if (/^re:\b/.test(l)) return false;
      if (/uscis-\d{4}-\d+/i.test(s) && /rin\s+\d/i.test(s)) return false;
      if (/^respectfully submits?\b/i.test(l)) return false;
      if (/^advises\b/i.test(l)) return false;
      if (s.length < 40) return false;
      return true;
    })
    .slice(0, 2);

  let core = picks.join(' ') || cleaned.slice(0, 420);
  if (core.length > 480) core = `${core.slice(0, 477).trim()}...`;

  // Generic voice: never lead with a personal/org name.
  if (!/^this comment\b/i.test(core)) {
    if (/^(argues|supports|requests|urges|opposes|notes|raises|asks)\b/i.test(core)) {
      core = `This comment ${core}`;
    } else {
      core = `This comment argues: ${core}`;
    }
  }
    if (/^This comment argues:\s*/i.test(core)) {
      core = core.replace(
        /^This comment argues:\s*(I|We)\b/i,
        'This comment argues that the commenter'
      );
    }
    core = core
      .replace(/\bWe commend\b/gi, 'The commenter commends')
      .replace(/\bOur comment\b/gi, 'This comment')
      .replace(/\bwe believe\b/gi, 'the commenter believes')
      .replace(/\s{2,}/g, ' ')
      .trim();

  return stripEmDash(core);
}

async function main() {
  console.log('Fetching document', DOCUMENT_ID);
  const doc = await apiGet(`/documents/${DOCUMENT_ID}`);
  const objectId = doc?.data?.attributes?.objectId;
  if (!objectId) throw new Error('Missing document objectId');
  console.log('objectId', objectId);

  const listed = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const q = new URLSearchParams({
      'filter[commentOnId]': objectId,
      'page[size]': '250',
      'page[number]': String(page),
      sort: 'documentId',
    });
    // apiGet appends api_key; build path with query manually
    const pageData = await apiGet(`/comments?${q.toString()}`);
    listed.push(...(pageData.data || []));
    hasNext = Boolean(pageData.meta?.hasNextPage);
    console.log(
      `List page ${page}: ${pageData.data?.length ?? 0}  ` +
        `totalElements=${pageData.meta?.totalElements ?? '?'}  ` +
        `hasNext=${hasNext}`,
    );
    page += 1;
    if (page > 20) break;
  }
  console.log('Listed', listed.length, 'comments');

  const comments = [];
  for (let i = 0; i < listed.length; i++) {
    const id = listed[i].id;
    const detail = await apiGet(`/comments/${id}`);
    const a = detail.data.attributes || {};
    const title = a.title || `Comment ${id}`;
    const { posterType, rawName } = posterFromTitle(title);
    const body = decodeEntities(a.comment || '');
    const theme = pickTheme(`${title}\n${body}`);
    const ai_summary = buildAiSummary(body, posterType, rawName);
    comments.push({
      id,
      // Generic title only; never persist real person/org names in public JSON.
      title: `Comment Submitted by ${posterLabel(posterType)}`,
      postedDate: a.postedDate || null,
      source_link: `https://www.regulations.gov/comment/${id}`,
      poster_type: posterType,
      poster_label: posterLabel(posterType),
      theme_id: theme.theme_id,
      theme_title: theme.theme_title,
      ai_summary,
      type: 'comments',
    });
    if ((i + 1) % 10 === 0 || i === listed.length - 1) {
      console.log(`Detail ${i + 1}/${listed.length}`);
    }
    await sleep(120);
  }

  comments.sort((a, b) => {
    const da = a.postedDate || '';
    const db = b.postedDate || '';
    if (da !== db) return db.localeCompare(da);
    return b.id.localeCompare(a.id);
  });

  const now = new Date();
  const stamp = now.toISOString();
  const envelope = {
    docket_id: DOCKET_ID,
    retrieved: stamp,
    total: comments.length,
    source: 'regulations.gov via api.data.gov',
    mode: 'first_party_anonymized_id_link_theme_summary',
    comments,
  };

  const stats = {
    docket_id: DOCKET_ID,
    total_comments: comments.length,
    last_pull: stamp,
    comment_period_ends: 'Aug 31, 2026 at 11:59 PM EDT',
    source: 'regulations.gov via api.data.gov',
    anonymization:
      "UI labels are Anonymous / Named person / Organization; ai_summary uses 'This comment' voice with names stripped",
    anonymized: true,
    mode: 'first_party_anonymized_id_link_theme_summary',
    ai_summaries_added: comments.filter((c) => c.ai_summary).length,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'all_comments.json'),
    JSON.stringify(envelope, null, 2) + '\n'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'stats.json'),
    JSON.stringify(stats, null, 2) + '\n'
  );

  const checkLog = [
    `${stamp} first-party pull via regulations.gov API`,
    `document ${DOCUMENT_ID} objectId ${objectId}`,
    `comments ${comments.length}; summaries ${stats.ai_summaries_added}`,
    'anonymized poster labels; Meta feed not used',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'check.log'), checkLog);

  const lastCheck = {
    pulled_at: stamp,
    docket_id: DOCKET_ID,
    document_id: DOCUMENT_ID,
    object_id: objectId,
    total_comments: comments.length,
    source: 'regulations.gov via api.data.gov',
    notes: 'First-party anonymized pull; no Meta dependency',
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'last-check.json'),
    JSON.stringify(lastCheck, null, 2) + '\n'
  );

  console.log('Wrote', path.join(OUT_DIR, 'all_comments.json'));
  console.log('Wrote', path.join(OUT_DIR, 'stats.json'));
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
