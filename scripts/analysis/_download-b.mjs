#!/usr/bin/env node
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const downloads = [
  { file: 'quarterly_all_forms_fy2023_q1.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2023_q1.xlsx' },
  { file: 'quarterly_all_forms_fy2023_q2.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2023_q2.xlsx' },
  { file: 'quarterly_all_forms_fy2023_q3.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2023_q3.xlsx' },
  { file: 'quarterly_all_forms_fy2023_q4.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2023_q4.xlsx' },
  { file: 'quarterly_all_forms_fy2024_q1.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2024_q1.xlsx' },
  { file: 'quarterly_all_forms_fy2024_q2.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2024_q2.xlsx' },
  { file: 'quarterly_all_forms_fy2024_q3.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2024_q3.xlsx' },
  { file: 'quarterly_all_forms_fy2024_q4.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2024_q4.xlsx' },
  { file: 'quarterly_all_forms_fy2025_q1.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2025_q1.xlsx' },
  { file: 'quarterly_all_forms_fy2025_q2.xlsx', url: 'https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2025_q2.xlsx' },
];

const DATA_DIR = path.resolve(process.argv[2] || path.dirname(new URL(import.meta.url).pathname), '..', '..', 'data', 'uscis-i526');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(new URL(res.headers.location, url).toString()).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      let len = 0;
      res.on('data', (c) => { chunks.push(c); len += c.length; });
      res.on('end', () => resolve(Buffer.concat(chunks, len)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  for (const { file, url } of downloads) {
    const out = path.join(DATA_DIR, file);
    try {
      const buf = await fetch(url);
      if (buf.length < 200000 || buf.length > 2000000) {
        console.log(`SKIP ${file} — ${buf.length} bytes`);
        if (fs.existsSync(out)) fs.unlinkSync(out);
        continue;
      }
      fs.writeFileSync(out, buf);
      console.log(`OK   ${file} — ${buf.length} bytes`);
    } catch (e) {
      console.log(`FAIL ${file} — ${e.message}`);
    }
  }
  console.log('\nFinal directory contents for quarterly_all_forms:');
  const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('quarterly_all_forms_')).sort();
  for (const f of files) {
    const st = fs.statSync(path.join(DATA_DIR, f));
    console.log(`  ${f}  (${st.size} bytes)`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
