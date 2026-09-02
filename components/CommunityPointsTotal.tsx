'use client';

import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

// Suma del mes en curso de todos los grupos — vive aparte de RankingBoard
// (que muestra el podio) porque el panel de voto se intercala entre ambos
// en la portada; cada uno mantiene su propia suscripción a `votes`.
export default function CommunityPointsTotal({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const total = rankings.reduce((sum, r) => sum + r.total_points, 0);

  return (
    <div className="text-center py-2">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Esta comunidad ha lanzado</p>
      <p className="text-4xl sm:text-5xl font-black text-amber-400 font-mono drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
        {total.toLocaleString('es-MX')} puntos
      </p>
    </div>
  );
}
