import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a3d32 100%)',
          color: '#d4af37',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        EB
      </div>
    ),
    { ...size }
  );
}
