#!/usr/bin/env node
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const variants = [];
// FY2023 + FY2024 Q2 patterns
for (const tag of [
  'fy2023_q1', 'fy2023_q2', 'fy2023_q3', 'fy2023_q4',
  'fy2024_q2',
]) {
  for (const base of [
    `quarterly_all_forms_${tag}.xlsx`,
    `quarterly_all_forms_${tag}_v1.xlsx`,
    tag.replace('fy', 'FY').replace('_q', 'Q') + '.xlsx',
    `Quarterly_All_Forms_${tag.replace('fy', 'FY').replace('_q', 'Q')}.xlsx`,
    `quarterly_all_forms_${tag}.pdf`,
  ]) {
    variants.push({
      file: base,
      url: `https://www.uscis.gov/sites/default/files/document/data/${base}`,
      tag,
    });
    variants.push({
      file: base,
      url: `https://www.uscis.gov/sites/default/files/document/reports/${base}`,
      tag: tag + '_reports',
    });
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(new URL(res.headers.location, url).toString()).then(resolve, reject);
      }
      resolve({ status: res.statusCode, size: Number(res.headers['content-length']) || 0, url });
      res.resume();
    });
    req.on('error', e => reject(e));
    req.end();
  });
}

const hits = [];
(async () => {
  for (const v of variants) {
    try {
      const r = await fetch(v.url);
      if (r.status === 200 && r.size > 100000) {
        hits.push(`HIT  ${r.size.toString().padStart(8)} ${v.file}  → ${v.url}`);
      }
    } catch {}
  }
  if (hits.length === 0) console.log('No additional B files found via pattern guesses. Confirmed FY23 only via PDF path.');
  else console.log(hits.join('\n'));
})();
