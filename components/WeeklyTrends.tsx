'use client';

import Link from 'next/link';
import { TrendingUp, Mic2 } from 'lucide-react';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

const TOP_COUNT = 5;

// "Tendencias semanales": quién ganó más puntos en los últimos 7 días —
// distinto del Ranking Global (que ordena por total del mes). No inventamos
// un historial de posiciones semanales que no llevamos; esto es solo la
// suma real de votos.points de los últimos 7 días, ordenada de mayor a
// menor.
export default function WeeklyTrends({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const trending = [...rankings].filter((r) => r.votes_7d > 0).sort((a, b) => b.votes_7d - a.votes_7d).slice(0, TOP_COUNT);

  if (trending.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-500" /> Tendencias semanales
      </h2>
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl divide-y divide-neutral-100 dark:divide-neutral-900 overflow-hidden">
        {trending.map((group, i) => (
          <Link
            key={group.group_id}
            href={`/grupo/${group.slug}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
          >
            <span className="w-5 shrink-0 text-sm font-black text-neutral-400">{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
              {group.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
              ) : (
                <Mic2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-600" />
              )}
            </div>
            <span className="flex-1 min-w-0 font-bold text-sm truncate">{group.group_name}</span>
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" /> +{group.votes_7d.toLocaleString('es-MX')}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
