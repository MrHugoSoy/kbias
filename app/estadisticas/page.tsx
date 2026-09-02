import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import LiveStatsSection from '@/components/LiveStatsSection';

export const metadata = {
  title: 'Estadísticas',
  description: 'Cifras en vivo de K-pop Wars: puntos totales, grupos activos y visitas desde el lanzamiento.',
};

export const revalidate = 0;

export default async function EstadisticasPage() {
  const supabase = getSupabasePublicClient();

  const { data: siteStats } = await supabase.from('site_stats').select('*').maybeSingle();
  const { data: pointsRows } = await supabase.from('votes').select('points');
  const totalPoints = (pointsRows ?? []).reduce((sum, r) => sum + r.points, 0);
  const { data: rankings } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_points', { ascending: false });

  return (
    <LegalPage title="Estadísticas en vivo" subtitle="Los números reales detrás de K-pop Wars, actualizados en el momento." wide>
      <LiveStatsSection
        initialRankings={rankings ?? []}
        initialTotalPoints={totalPoints}
        totalVisits={siteStats?.total_visits ?? 0}
      />
    </LegalPage>
  );
}
