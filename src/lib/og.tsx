import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getHomeStats } from '@/lib/projects';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

type OgStats = {
  projects: number;
  regionalCenters: number;
  investors: number;
  confirmations: number;
};

const FALLBACK_STATS: OgStats = {
  projects: 0,
  regionalCenters: 0,
  investors: 0,
  confirmations: 0,
};

const FEATURES = [
  {
    title: 'Browse projects',
    body: 'Search by regional center, location, TEA, and I-956F status.',
  },
  {
    title: 'Confirm status',
    body: 'Share whether a project is still open for subscriptions.',
  },
  {
    title: 'Add what you know',
    body: 'Contribute factual details so fellow investors stay informed.',
  },
];

async function loadLogoDataUrl() {
  const bytes = await readFile(join(process.cwd(), 'public/logo.png'));
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

async function loadJakartaFont(weight: 500 | 600 | 700) {
  // Request TTF (not woff2) — @vercel/og / Satori only parse OpenType/TrueType.
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

async function getStatsSafe(): Promise<OgStats> {
  if (!isSupabaseConfigured()) return FALLBACK_STATS;
  try {
    return await getHomeStats();
  } catch {
    return FALLBACK_STATS;
  }
}

function formatStat(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export async function createOgImage() {
  const [logoSrc, stats, fontMedium, fontSemiBold, fontBold] = await Promise.all([
    loadLogoDataUrl(),
    getStatsSafe(),
    loadJakartaFont(500),
    loadJakartaFont(600),
    loadJakartaFont(700),
  ]);

  const showStats = stats.projects >= 10;
  const statItems = [
    { label: 'Projects', value: stats.projects },
    { label: 'Regional Centers', value: stats.regionalCenters },
    { label: 'Investors', value: stats.investors },
    { label: 'Confirmations', value: stats.confirmations },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px 44px',
          background: 'linear-gradient(135deg, #060f1a 0%, #0a1628 32%, #1a3d32 72%, #0a1628 100%)',
          fontFamily: 'Plus Jakarta Sans',
          color: '#f5f1ea',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Atmosphere glows */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -20,
            width: 460,
            height: 460,
            borderRadius: 999,
            background:
              'radial-gradient(circle, rgba(184, 115, 51, 0.3) 0%, rgba(212, 175, 55, 0.12) 42%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            left: -80,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(45, 90, 71, 0.4) 0%, transparent 68%)',
          }}
        />

        {/* Gold → copper → forest accent rule */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #d4af37 0%, #b87333 55%, #2d5a47 100%)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires raw <img> */}
            <img
              src={logoSrc}
              width={68}
              height={68}
              alt=""
              style={{ borderRadius: 16 }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 500,
                  color: 'rgba(245, 241, 234, 0.78)',
                  letterSpacing: '0.04em',
                }}
              >
                EB5
              </span>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: '#d4af37',
                  letterSpacing: '-0.02em',
                }}
              >
                Base
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: 'rgba(250, 247, 242, 0.06)',
              color: '#d4af37',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Community-built · Investor-led
          </div>
        </div>

        {/* Headline + supporting copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              color: '#faf7f2',
            }}
          >
            The EB-5 Project Directory
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: 'rgba(245, 241, 234, 0.74)',
              lineHeight: 1.35,
              maxWidth: 980,
            }}
          >
            Free directory of regional center projects. Browse listings, confirm
            subscription status, and help keep the community current.
          </div>
        </div>

        {/* Full-width info strip: live stats when available, otherwise value props */}
        {showStats ? (
          <div style={{ display: 'flex', gap: 14, marginTop: 10, width: '100%' }}>
            {statItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: '22px 24px',
                  borderRadius: 18,
                  background: 'rgba(250, 247, 242, 0.09)',
                  border: '1px solid rgba(212, 175, 55, 0.24)',
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: 700,
                    color: '#d4af37',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {formatStat(item.value)}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(245, 241, 234, 0.58)',
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, marginTop: 10, width: '100%' }}>
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: '22px 24px',
                  borderRadius: 18,
                  background: 'rgba(250, 247, 242, 0.09)',
                  border: '1px solid rgba(45, 90, 71, 0.5)',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#d4af37',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {feature.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'rgba(245, 241, 234, 0.7)',
                    lineHeight: 1.35,
                  }}
                >
                  {feature.body}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'rgba(245, 241, 234, 0.78)',
              letterSpacing: '0.02em',
            }}
          >
            eb5base.com
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 18,
              fontWeight: 500,
              color: 'rgba(245, 241, 234, 0.55)',
            }}
          >
            No account needed to browse
            <span style={{ color: '#d4af37' }}>·</span>
            Built for EB-5 investors
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Plus Jakarta Sans', data: fontMedium, weight: 500, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: fontSemiBold, weight: 600, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: fontBold, weight: 700, style: 'normal' },
      ],
    }
  );
}
