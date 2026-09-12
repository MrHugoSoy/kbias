'use client';

import Link from 'next/link';
import { Crown, Mic2, Trophy } from 'lucide-react';
import BidButton from './BidButton';
import RankChange from './RankChange';
import GroupFollowButton from './GroupFollowButton';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

const RANK_COLOR: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-neutral-400',
  3: 'text-orange-400',
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={'inline-flex items-center gap-1 font-black ' + RANK_COLOR[rank]}>
        {rank === 1 && <Crown className="w-4 h-4 fill-current" />}
        {rank}
      </span>
    );
  }
  return <span className="text-neutral-500 font-mono">{rank}</span>;
}

function RankingRowItem({ rank, group }: { rank: number; group: RankingRow }) {
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-900 last:border-0">
      <td className="py-3 pl-3 pr-1.5 w-8">
        <RankBadge rank={rank} />
      </td>
      <td className="py-3 px-1.5 min-w-0">
        <Link href={`/grupo/${group.slug}`} className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
            {group.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
            ) : (
              <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
              {group.group_name}
            </p>
            {group.fandom_name && <p className="text-[11px] text-violet-500 truncate">{group.fandom_name}</p>}
          </div>
        </Link>
      </td>
      <td className="py-3 px-1.5 text-right font-mono text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">
        {group.total_points.toLocaleString('es-MX')}
      </td>
      <td className="py-3 px-1.5 text-right">
        <RankChange current={rank} previous={group.rank_snapshot_value} />
      </td>
      <td className="hidden xl:table-cell py-3 px-1.5 text-right font-mono text-xs text-neutral-500 whitespace-nowrap">
        {group.votes_24h > 0 ? `+${group.votes_24h.toLocaleString('es-MX')}` : '—'}
      </td>
      <td className="py-3 pl-1.5 pr-3">
        <div className="flex items-center justify-end gap-2">
          <BidButton compact floatingMessage groupId={group.group_id} groupName={group.group_name} />
          <GroupFollowButton groupId={group.group_id} iconOnly />
        </div>
      </td>
    </tr>
  );
}

// Tabla del Ranking Global de la portada — reemplaza las tarjetas de podio +
// la lista aparte del resto (RankingBoard/RestRankingList) por una sola
// tabla con las columnas reales que ya calculamos: puntos, cambio de hoy
// (RankChange) y votos de las últimas 24h (group_rankings.votes_24h).
export default function RankingTable({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);

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

      {rankings.length === 0 ? (
        <p className="text-center text-neutral-500 py-10 text-sm">Todavía no hay grupos registrados.</p>
      ) : (
        <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden">
          {/* Altura fija (no max-h) para que esta tabla y "Votos en tiempo
              real" (misma altura en ActivityFeed) queden parejas en la
              portada — el resto del ranking se ve haciendo scroll adentro. */}
          <div
            className={
              // Mismo scrollbar delgado (invisible hasta hover) que usa
              // ActivityFeed — antes esta tabla se quedaba con el scrollbar
              // por default del navegador, que se ve distinto.
              'overflow-x-auto overflow-y-auto h-[44rem] ' +
              '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:theme(colors.violet.400/0.5)_transparent] ' +
              '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
              '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent ' +
              '[&:hover::-webkit-scrollbar-thumb]:bg-violet-400/60'
            }
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-950">
                <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-200 dark:border-neutral-900">
                  <th className="py-2 pl-3 pr-1.5 font-semibold">#</th>
                  <th className="py-2 px-1.5 font-semibold">Grupo</th>
                  <th className="py-2 px-1.5 font-semibold text-right">Puntos</th>
                  <th className="py-2 px-1.5 font-semibold text-right">Cambio</th>
                  <th className="hidden xl:table-cell py-2 px-1.5 font-semibold text-right">Votos (24h)</th>
                  <th className="py-2 pl-1.5 pr-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <RankingRowItem key={r.group_id} rank={i + 1} group={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
