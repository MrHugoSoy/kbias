'use client';

import Link from 'next/link';
import { Mic2 } from 'lucide-react';
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

// Cifras y ranking completo de /estadisticas, en vivo — mismo hook que usan
// la portada y la página de grupo, así que un punto nuevo se ve reflejado
// aquí también sin recargar.
export default function LiveStatsSection({
  initialRankings,
  initialTotalPoints,
  totalVisits,
}: {
  initialRankings: RankingRow[];
  initialTotalPoints: number;
  totalVisits: number;
}) {
  const rankings = useLiveRankings(initialRankings);
  const totalPoints = useLiveTotalPoints(initialTotalPoints);
  const groupsWithPoints = rankings.filter((r) => r.total_points > 0).length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Puntos totales" value={totalPoints.toLocaleString('es-MX')} />
        <StatCard label="Grupos con puntos" value={groupsWithPoints.toLocaleString('es-MX')} />
        <StatCard label="Visitas desde el lanzamiento" value={totalVisits.toLocaleString('es-MX')} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400">Ranking completo de este mes</h2>
        {rankings.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay grupos registrados.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
            {rankings.map((r, i) => (
              <div key={r.group_id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="text-neutral-500 font-mono w-8 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 relative transition-transform duration-200 hover:scale-[5] hover:z-20">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                  ) : (
                    <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{r.group_name}</p>
                  <p className="text-xs text-pink-400 truncate">{r.fandom_name}</p>
                </div>
                <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0">
                  {r.total_points.toLocaleString('es-MX')} puntos
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-600">
        ¿Quieres ver el podio en vivo? Vuelve al{' '}
        <Link href="/#ranking" className="underline hover:text-pink-500 dark:hover:text-pink-400">
          ranking principal
        </Link>
        , o revisa a los campeones de meses anteriores en el{' '}
        <Link href="/salon-de-la-fama" className="underline hover:text-pink-500 dark:hover:text-pink-400">
          Salón de la Fama
        </Link>
        .
      </p>
    </>
  );
}
