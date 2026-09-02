'use client';

import { useLiveRankings } from '@/lib/useLiveRankings';
import { useLiveTotalPoints } from '@/lib/useLiveTotalPoints';
import type { RankingRow } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 text-center">
      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{value}</p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

// Las únicas dos cifras del Salón de la Fama que cambian mientras el mes
// sigue en curso — los campeones de meses ya cerrados son historial fijo,
// así que esos se quedan como render de servidor.
export default function LiveHallOfFameStats({
  initialCurrentRankings,
  initialTotalPoints,
}: {
  initialCurrentRankings: RankingRow[];
  initialTotalPoints: number;
}) {
  const currentRankings = useLiveRankings(initialCurrentRankings);
  const totalPoints = useLiveTotalPoints(initialTotalPoints);
  const groupsWithPointsThisMonth = currentRankings.filter((r) => r.total_points > 0).length;

  return (
    <>
      <StatCard label="Puntos totales del sitio" value={totalPoints.toLocaleString('es-MX')} />
      <StatCard label="Grupos con puntos este mes" value={groupsWithPointsThisMonth.toLocaleString('es-MX')} />
    </>
  );
}
