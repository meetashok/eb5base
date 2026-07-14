import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { isMaintenanceMode } from '@/lib/maintenance';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const FEATURES = [
  {
    title: 'Track cases',
    body: 'I-526E, I-485, I-131, and I-765 for your whole family.',
  },
  {
    title: 'Encrypted receipts',
    body: 'AES-256 at rest. Plaintext never stored in the database.',
  },
  {
    title: 'Status alerts',
    body: 'Email when USCIS updates a case you track.',
  },
];

async function loadLogoDataUrl() {
  const bytes = await readFile(join(process.cwd(), 'public/logo.png'));
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

async function loadJakartaFont(weight: 500 | 600 | 700) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    }
  ).then((res) => res.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match?.[1]) {
    throw new Error(`Could not resolve Plus Jakarta Sans ${weight}`);
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

async function createMaintenanceOgImage() {
  const [logoSrc, fontMedium, fontSemiBold, fontBold] = await Promise.all([
    loadLogoDataUrl(),
    loadJakartaFont(500),
    loadJakartaFont(600),
    loadJakartaFont(700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(145deg, #0a1628 0%, #14304a 55%, #2d5a47 100%)',
          color: '#faf7f2',
          fontFamily: 'Jakarta',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={84} height={84} alt="" />
        <div style={{ fontSize: 54, fontWeight: 700, marginTop: 28 }}>EB5 Base</div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 12 }}>Temporarily unavailable</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Jakarta', data: fontMedium, weight: 500, style: 'normal' },
        { name: 'Jakarta', data: fontSemiBold, weight: 600, style: 'normal' },
        { name: 'Jakarta', data: fontBold, weight: 700, style: 'normal' },
      ],
    }
  );
}

export async function createOgImage() {
  if (isMaintenanceMode()) {
    return createMaintenanceOgImage();
  }

  const [logoSrc, fontMedium, fontSemiBold, fontBold] = await Promise.all([
    loadLogoDataUrl(),
    loadJakartaFont(500),
    loadJakartaFont(600),
    loadJakartaFont(700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 64,
          background: '#faf7f2',
          color: '#0a1628',
          fontFamily: 'Jakarta',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={72} height={72} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 700 }}>
              EB5 <span style={{ color: '#d4af37' }}>Base</span>
            </div>
            <div style={{ fontSize: 22, color: '#2d5a47', fontWeight: 600 }}>
              EB-5 case status tracker
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 24,
                borderRadius: 20,
                background: 'white',
                border: '1px solid rgba(10,22,40,0.08)',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700 }}>{f.title}</div>
              <div style={{ fontSize: 18, marginTop: 10, color: '#4b5563', lineHeight: 1.4 }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Jakarta', data: fontMedium, weight: 500, style: 'normal' },
        { name: 'Jakarta', data: fontSemiBold, weight: 600, style: 'normal' },
        { name: 'Jakarta', data: fontBold, weight: 700, style: 'normal' },
      ],
    }
  );
}
