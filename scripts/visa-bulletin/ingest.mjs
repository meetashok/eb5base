#!/usr/bin/env node
/**
 * Ingest U.S. Department of State Visa Bulletin cut-off dates into Supabase
 * (visa_bulletin_releases / visa_bulletin_dates). Parser: ./parse.mjs.
 *
 * Usage:
 *   node scripts/visa-bulletin/ingest.mjs --latest              # self-gating daily poll
 *   node scripts/visa-bulletin/ingest.mjs --month 2026-07
 *   node scripts/visa-bulletin/ingest.mjs --backfill 2015-10..2026-01
 *   node scripts/visa-bulletin/ingest.mjs --backfill 2015-10..2026-01 --dry-run
 *
 * Source of HTML (--source):
 *   live   (default) travel.state.gov  -- use in CI / from a non-blocked IP
 *   mirror           vyakunin/visa_bulletin cached DOS pages (GitHub raw)
 *                    -- fallback for environments where travel.state.gov is
 *                       Cloudflare-blocked (e.g. this sandbox). source_url is
 *                       always stored as the canonical travel.state.gov link.
 *
 * Env (write mode): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (reads .env.local automatically if present).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseBulletinHtml } from './parse.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function loadDotEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadDotEnvLocal();

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

/** Fiscal year folder used in the canonical travel.state.gov URL. */
function fiscalYear(year, monthNum) {
  return monthNum >= 10 ? year + 1 : year;
}

function slug(year, monthNum) {
  return `visa-bulletin-for-${MONTH_NAMES[monthNum - 1]}-${year}`;
}

function canonicalUrl(year, monthNum) {
  const fy = fiscalYear(year, monthNum);
  return `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/${fy}/${slug(year, monthNum)}.html`;
}

function mirrorUrl(year, monthNum) {
  return `https://raw.githubusercontent.com/vyakunin/visa_bulletin/HEAD/data/bulletin/saved_pages/${slug(year, monthNum)}.html`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  if (/Attention Required|cf-error-details|Cloudflare/i.test(html.slice(0, 2000))) {
    throw new Error(`Cloudflare block for ${url}`);
  }
  return html;
}

/** Fetch one month's HTML from the chosen source (with source-specific URL). */
async function getMonthHtml(year, monthNum, source) {
  if (source === 'file') {
    return readFileSync(argValue('--file'), 'utf8');
  }
  const url = source === 'mirror' ? mirrorUrl(year, monthNum) : canonicalUrl(year, monthNum);
  return fetchHtml(url);
}

function parseMonthArg(s) {
  const m = /^(\d{4})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  return { year: Number(m[1]), monthNum: Number(m[2]) };
}

function monthList(fromStr, toStr) {
  const from = parseMonthArg(fromStr);
  const to = parseMonthArg(toStr);
  if (!from || !to) throw new Error('bad --backfill range (expected YYYY-MM..YYYY-MM)');
  const out = [];
  let y = from.year;
  let mo = from.monthNum;
  while (y < to.year || (y === to.year && mo <= to.monthNum)) {
    out.push({ year: y, monthNum: mo });
    mo += 1;
    if (mo > 12) { mo = 1; y += 1; }
  }
  return out;
}

async function ingestMonth(supabase, { year, monthNum }, source) {
  const html = await getMonthHtml(year, monthNum, source);
  const { rows, meta } = parseBulletinHtml(html, { month: `${year}-${String(monthNum).padStart(2, '0')}` });
  if (meta.employmentTables === 0 || rows.length === 0) {
    throw new Error(`no employment rows parsed for ${year}-${monthNum}`);
  }
  const bulletinMonth = `${year}-${String(monthNum).padStart(2, '0')}-01`;
  const summary = {
    month: `${year}-${String(monthNum).padStart(2, '0')}`,
    rows: rows.length,
    eb5: rows.filter((r) => r.preference === 'EB5').length,
  };
  if (DRY_RUN || !supabase) return summary;

  const { data: release, error: relErr } = await supabase
    .from('visa_bulletin_releases')
    .upsert(
      {
        bulletin_month: bulletinMonth,
        fiscal_year: fiscalYear(year, monthNum),
        source_url: canonicalUrl(year, monthNum),
        source_title: `Visa Bulletin For ${MONTH_NAMES[monthNum - 1].replace(/^./, (c) => c.toUpperCase())} ${year}`,
        scraped_at: new Date().toISOString(),
      },
      { onConflict: 'bulletin_month' },
    )
    .select('id')
    .single();
  if (relErr) throw new Error(`release upsert: ${relErr.message}`);

  await supabase.from('visa_bulletin_dates').delete().eq('release_id', release.id);
  const payload = rows.map((r) => ({
    release_id: release.id,
    preference: r.preference,
    subcategory: r.subcategory,
    country: r.country,
    date_type: r.dateType,
    status: r.status,
    cutoff_date: r.cutoff,
  }));
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await supabase.from('visa_bulletin_dates').insert(payload.slice(i, i + 500));
    if (error) throw new Error(`dates insert: ${error.message}`);
  }
  return summary;
}

async function getSupabase() {
  if (DRY_RUN) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const source = argValue('--source') || (process.argv.includes('--file') ? 'file' : 'live');
  const supabase = await getSupabase();

  let months;
  if (process.argv.includes('--backfill')) {
    const [from, to] = (argValue('--backfill') || '').split('..');
    months = monthList(from, to);
  } else if (process.argv.includes('--latest')) {
    // Self-gating: consider a 3-month window (bulletins publish ~a month ahead)
    // and skip any month already stored -> daily runs no-op once captured.
    const now = new Date();
    months = [0, 1, 2].map((k) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 1));
      return { year: d.getUTCFullYear(), monthNum: d.getUTCMonth() + 1 };
    });
    if (supabase) {
      const { data } = await supabase.from('visa_bulletin_releases').select('bulletin_month');
      const have = new Set((data || []).map((r) => r.bulletin_month.slice(0, 7)));
      months = months.filter((m) => !have.has(`${m.year}-${String(m.monthNum).padStart(2, '0')}`));
    }
    if (months.length === 0) console.log('Up to date; nothing to fetch.');
  } else {
    const m = parseMonthArg(argValue('--month'));
    if (!m) {
      console.error('Provide --month YYYY-MM, --backfill A..B, or --latest.');
      process.exit(1);
    }
    months = [m];
  }

  let ok = 0;
  let fail = 0;
  for (const m of months) {
    try {
      const s = await ingestMonth(supabase, m, source);
      ok += 1;
      console.log(`  ${s.month}  rows=${String(s.rows).padStart(4)}  eb5=${s.eb5}${DRY_RUN ? '  (dry)' : ''}`);
    } catch (err) {
      fail += 1;
      console.warn(`  ${m.year}-${String(m.monthNum).padStart(2, '0')}  SKIP: ${err.message}`);
    }
  }
  console.log(`\nDone. ok=${ok} fail=${fail}${DRY_RUN ? ' (dry run)' : ''}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
