import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'K-pop Wars — El poder es de los fans';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a0c 0%, #1a0512 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
            fill="#ec4899"
            stroke="#ec4899"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5 21h14" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 900, color: 'white', letterSpacing: -2, marginTop: 24 }}>
          K-POP WARS
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#f472b6', marginTop: 12, letterSpacing: 8 }}>
          EL PODER ES DE LOS FANS
        </div>
      </div>
    ),
    { ...size }
  );
}
