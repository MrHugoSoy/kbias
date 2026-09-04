import { notFound } from 'next/navigation';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import GroupDetailCard from '@/components/GroupDetailCard';
import type { Comment } from '@/components/GroupComments';
import { siteUrl } from '@/lib/siteUrl';
import { utcDayStart } from '@/lib/dailyWindow';
import type { NewsPost, GroupMember, GroupBattleForGroup, GroupBattleStatus } from '@/lib/types';

const SPARKLINE_DAYS = 14;

export const revalidate = 0;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data: group } = await supabase
    .from('groups')
    .select('name, fandom_name, bio')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!group) return { title: 'Grupo' };

  const title = group.name;
  const description =
    group.bio ||
    `Vota gratis por ${group.name}${group.fandom_name ? ` (${group.fandom_name})` : ''} en K-pop Wars — dale tus puntos y súmalos al total de tu grupo.`;
  const url = `${siteUrl}/grupo/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/grupo/${params.slug}` },
    openGraph: {
      title,
      description,
      url,
      siteName: 'K-pop Wars',
      locale: 'es_MX',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function GroupDetailPage({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data: rankings } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_points', { ascending: false });

  const list = rankings ?? [];
  const index = list.findIndex((r) => r.slug === params.slug);
  if (index === -1) notFound();

  const group = list[index];
  const rank = index + 1;

  // Sin límite fijo: un tope como "últimos 50" puede dejar respuestas
  // huérfanas cuando su comentario padre es más viejo que eso (ver
  // /api/comments, que sirve el mismo dato para las cargas posteriores).
  const { data: comments } = await supabase
    .from('group_comments_feed')
    .select('*')
    .eq('group_id', group.group_id)
    .order('created_at', { ascending: false });

  const { data: newsRows } = await supabase
    .from('news_posts')
    .select('id, title, body, cover_url, category, published_at, group:groups(name, slug, image_url)')
    .eq('group_id', group.group_id)
    .order('published_at', { ascending: false });

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('id, name, role, image_url, social_url')
    .eq('group_id', group.group_id)
    .order('sort_order', { ascending: true });

  // Batallas donde este grupo es cualquiera de los dos lados — se "orienta"
  // acá (lado propio vs. lado rival) para que el componente no tenga que
  // repetir el `group_a_id === id ? ... : ...` en cada tarjeta.
  const { data: battleRows } = await supabase
    .from('group_battle_feed')
    .select('*')
    .or(`group_a_id.eq.${group.group_id},group_b_id.eq.${group.group_id}`);

  const battles: GroupBattleForGroup[] = (battleRows ?? []).map((b) => {
    const isSideA = b.group_a_id === group.group_id;
    return {
      battle_id: b.battle_id,
      status: b.status as GroupBattleStatus,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      my_points: isSideA ? b.group_a_points : b.group_b_points,
      opponent_id: isSideA ? b.group_b_id : b.group_a_id,
      opponent_name: isSideA ? b.group_b_name : b.group_a_name,
      opponent_slug: isSideA ? b.group_b_slug : b.group_a_slug,
      opponent_image: isSideA ? b.group_b_image : b.group_a_image,
      opponent_points: isSideA ? b.group_b_points : b.group_a_points,
    };
  });

  // Estadísticas históricas de la pestaña "Estadísticas" — se calculan acá
  // (no en una vista) porque son específicas de este grupo y de este
  // request, sin necesidad de una suscripción en vivo aparte.
  const { data: allVotes } = await supabase.from('votes').select('points, created_at').eq('group_id', group.group_id);
  const votes = allVotes ?? [];
  const totalVotesAllTime = votes.reduce((sum, v) => sum + v.points, 0);
  const todayStart = utcDayStart();
  const votesToday = votes
    .filter((v) => new Date(v.created_at) >= todayStart)
    .reduce((sum, v) => sum + v.points, 0);

  const dailySeries = Array.from({ length: SPARKLINE_DAYS }, (_, i) => {
    const dayStart = new Date(todayStart.getTime() - (SPARKLINE_DAYS - 1 - i) * 86_400_000);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    return votes
      .filter((v) => {
        const t = new Date(v.created_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      })
      .reduce((sum, v) => sum + v.points, 0);
  });

  return (
    <LegalPage
      title={group.group_name}
      subtitle={group.fandom_name ? `♥ ${group.fandom_name} ♥` : `Puesto #${rank} de ${list.length}`}
      wide
    >
      <GroupDetailCard
        group={group}
        initialRankings={list}
        stats={{ totalVotesAllTime, votesToday, dailySeries }}
        newsPosts={(newsRows ?? []) as unknown as NewsPost[]}
        members={(memberRows ?? []) as GroupMember[]}
        battles={battles}
        comments={(comments ?? []) as Comment[]}
      />
    </LegalPage>
  );
}
