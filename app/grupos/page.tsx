import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import GroupsPageClient from '@/components/GroupsPageClient';
import type { GroupWithStats } from '@/lib/types';

export const metadata = {
  title: 'Grupos',
  description: 'Descubre y apoya a tus grupos de K-pop favoritos.',
};

export const revalidate = 0;

export default async function GruposPage() {
  const supabase = getSupabasePublicClient();

  const [{ data: groups }, { data: rankings }, { data: battles }] = await Promise.all([
    supabase.from('groups').select('id, slug, name, fandom_name, image_url, agency, genre, bio, official_url'),
    supabase.from('group_rankings').select('group_id, total_points').order('total_points', { ascending: false }),
    supabase.from('group_battle_feed').select('group_a_id, group_b_id, status').in('status', ['active', 'upcoming']),
  ]);

  const statsByGroup = new Map((rankings ?? []).map((r, i) => [r.group_id, { points: r.total_points, rank: i + 1 }]));

  // Si un grupo está en dos batallas a la vez (raro, pero posible con el
  // emparejado manual del admin), "en batalla" gana sobre "próxima".
  const battleStatusByGroup = new Map<string, 'battle' | 'upcoming'>();
  for (const b of battles ?? []) {
    const status = b.status === 'active' ? 'battle' : 'upcoming';
    for (const groupId of [b.group_a_id, b.group_b_id]) {
      if (battleStatusByGroup.get(groupId) !== 'battle') battleStatusByGroup.set(groupId, status);
    }
  }

  const rows: GroupWithStats[] = (groups ?? [])
    .map((g) => {
      const stats = statsByGroup.get(g.id);
      return {
        ...g,
        total_points: stats?.points ?? 0,
        rank: stats?.rank ?? (groups?.length ?? 0),
        battle_status: (battleStatusByGroup.get(g.id) ?? 'none') as GroupWithStats['battle_status'],
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return (
    <LegalPage title="Grupos" subtitle="Descubre, sigue y apoya a tus grupos favoritos. Cada voto los acerca a la victoria." wide>
      <GroupsPageClient groups={rows} />
    </LegalPage>
  );
}
