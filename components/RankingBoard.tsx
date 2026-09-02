'use client';

import Link from 'next/link';
import { Mic2, Trophy } from 'lucide-react';
import BidButton from './BidButton';
import RankChange from './RankChange';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

const RING_BY_RANK: Record<number, string> = {
  1: 'border-amber-400',
  2: 'border-neutral-400 dark:border-neutral-500',
  3: 'border-orange-400',
};
const BADGE_BY_RANK: Record<number, string> = {
  1: 'bg-amber-400 text-black',
  2: 'bg-neutral-300 text-black',
  3: 'bg-orange-400 text-black',
};

function RankCard({ rank, group }: { rank: number; group: RankingRow }) {
  const ring = RING_BY_RANK[rank] ?? 'border-violet-200 dark:border-violet-900';
  const badge = BADGE_BY_RANK[rank] ?? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white';

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 text-center space-y-2 hover:shadow-md dark:hover:border-neutral-700 transition">
      <div className="relative w-16 h-16 mx-auto">
        <div className={`w-16 h-16 rounded-full border-2 ${ring} bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center`}>
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
          ) : (
            <Mic2 className="w-6 h-6 text-neutral-500 dark:text-neutral-600" />
          )}
        </div>
        <span className={`absolute -top-1 -left-1 w-6 h-6 rounded-full ${badge} text-xs font-black flex items-center justify-center shadow`}>
          {rank}
        </span>
      </div>
      <Link href={`/grupo/${group.slug}`} className="block font-bold text-sm truncate hover:text-violet-600 dark:hover:text-violet-400 transition">
        {group.group_name}
      </Link>
      <p className="font-mono text-sm text-neutral-500">
        {group.total_points > 0 ? `${group.total_points.toLocaleString('es-MX')} puntos` : 'Sin puntos aún'}
      </p>
      <RankChange current={rank} previous={group.rank_snapshot_value} />
      <div className="pt-1">
        <BidButton compact groupId={group.group_id} groupName={group.group_name} />
      </div>
    </div>
  );
}

export default function RankingBoard({
  initialRankings,
  currentMonthLabel,
  nextMonthLabel,
}: {
  initialRankings: RankingRow[];
  currentMonthLabel: string;
  nextMonthLabel: string;
}) {
  const rankings = useLiveRankings(initialRankings);
  const top = rankings.slice(0, 6);

  return (
    <section id="ranking" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Ranking Global
        </h2>
        <Link href="/estadisticas" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          Ver ranking completo
        </Link>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
        Ranking de {currentMonthLabel} — se reinicia el 1 de {nextMonthLabel}
      </p>

      {top.length === 0 ? (
        <p className="text-center text-neutral-500 py-10 text-sm">Todavía no hay grupos registrados.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {top.map((r, i) => (
            <RankCard key={r.group_id} rank={i + 1} group={r} />
          ))}
        </div>
      )}
    </section>
  );
}
