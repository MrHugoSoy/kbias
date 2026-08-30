import { ImageResponse } from 'next/og';
import { getSupabasePublicClient } from '@/lib/supabase';

export const runtime = 'edge';
export const alt = 'K-pop Wars';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const supabase = getSupabasePublicClient();
  const { data: group } = await supabase
    .from('group_rankings')
    .select('group_name, fandom_name, image_url, total_points')
    .eq('slug', params.slug)
    .maybeSingle();

  const name = group?.group_name ?? 'K-pop Wars';
  const fandom = group?.fandom_name;
  const votes = group?.total_points ?? 0;
  const photo = group?.image_url;

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
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={220}
            height={220}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '6px solid #ec4899' }}
          />
        ) : (
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 100,
            }}
          >
            🎤
          </div>
        )}
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 900, color: 'white', marginTop: 28 }}>{name}</div>
        {fandom && (
          <div style={{ display: 'flex', fontSize: 28, color: '#f472b6', marginTop: 6 }}>♥ {fandom} ♥</div>
        )}
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, color: '#fbbf24', marginTop: 20 }}>
          {votes.toLocaleString('es-MX')} votos
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#71717a', marginTop: 24, letterSpacing: 4 }}>
          KPOPWARS.COM
        </div>
      </div>
    ),
    { ...size }
  );
}
