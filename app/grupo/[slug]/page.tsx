import { notFound } from 'next/navigation';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import GroupDetailCard from '@/components/GroupDetailCard';
import GroupComments from '@/components/GroupComments';
import { siteUrl } from '@/lib/siteUrl';

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

  return (
    <LegalPage
      title={group.group_name}
      subtitle={group.fandom_name ? `♥ ${group.fandom_name} ♥` : `Puesto #${rank} de ${list.length}`}
    >
      <GroupDetailCard group={group} initialRankings={list} />

      <GroupComments groupId={group.group_id} initialComments={comments ?? []} />
    </LegalPage>
  );
}
