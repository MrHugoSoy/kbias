'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mic2 } from 'lucide-react';
import { useLiveRankings } from '@/lib/useLiveRankings';
import { useLiveTotalPoints } from '@/lib/useLiveTotalPoints';
import RankChange from './RankChange';
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
// Orden visual del podio (2°, 1° al centro y más grande, 3°) — igual que en
// la portada.
const PODIUM_ORDER = [1, 0, 2];

const PAGE_SIZE = 10;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 text-center">
      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{value}</p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function PodiumCard({ rank, group }: { rank: number; group: RankingRow }) {
  const ring = RING_BY_RANK[rank] ?? 'border-violet-200 dark:border-violet-900';
  const badge = BADGE_BY_RANK[rank] ?? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white';
  const isFirst = rank === 1;

  return (
    <div
      className={
        'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl text-center space-y-2 ' +
        (isFirst ? 'p-6 sm:-mt-4' : 'p-4')
      }
    >
      <div className={'relative mx-auto ' + (isFirst ? 'w-20 h-20' : 'w-16 h-16')}>
        <div className={`w-full h-full rounded-full border-2 ${ring} bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center`}>
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
      <Link href={`/grupo/${group.slug}`} className="block font-bold truncate hover:text-violet-600 dark:hover:text-violet-400 transition">
        {group.group_name}
      </Link>
      <p className="font-mono text-sm text-neutral-500">
        {group.total_points.toLocaleString('es-MX')} {group.total_points === 1 ? 'punto' : 'puntos'}
      </p>
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
  const [visibleCount, setVisibleCount] = useState(3 + PAGE_SIZE);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, visibleCount);
  const hasMore = rankings.length > visibleCount;

  return (
    <>
      {/* Pestañas de rango — solo "Mensual" calcula algo hoy; las otras dos
          quedan visibles pero deshabilitadas en vez de inventar datos que
          no llevamos (ranking histórico total y semanal). */}
      <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 text-sm font-semibold">
        <span className="pb-2 border-b-2 border-violet-600 text-violet-600 dark:text-violet-400">Mensual</span>
        <span className="pb-2 text-neutral-400 dark:text-neutral-600 cursor-not-allowed" title="Próximamente">
          Global
        </span>
        <span className="pb-2 text-neutral-400 dark:text-neutral-600 cursor-not-allowed" title="Próximamente">
          Semanal
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Puntos totales" value={totalPoints.toLocaleString('es-MX')} />
        <StatCard label="Grupos con puntos" value={groupsWithPoints.toLocaleString('es-MX')} />
        <StatCard label="Visitas desde el lanzamiento" value={totalVisits.toLocaleString('es-MX')} />
      </div>

      {rankings.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay grupos registrados.</p>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {PODIUM_ORDER.map((i) => {
                const r = top3[i];
                if (!r) return <div key={i} />;
                return <PodiumCard key={r.group_id} rank={i + 1} group={r} />;
              })}
            </div>
          )}

          {rest.length > 0 && (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
              {rest.map((r, i) => {
                const rank = i + 4;
                return (
                  <div key={r.group_id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="text-neutral-500 font-mono w-8 shrink-0">#{rank}</span>
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                      ) : (
                        <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{r.group_name}</p>
                      <p className="text-xs text-violet-500 truncate">{r.fandom_name}</p>
                    </div>
                    <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0">
                      {r.total_points.toLocaleString('es-MX')} puntos
                    </span>
                    <div className="w-16 shrink-0 text-right">
                      <RankChange current={rank} previous={r.rank_snapshot_value} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
            >
              Cargar más
            </button>
          )}
        </>
      )}

      <p className="text-xs text-neutral-500 dark:text-neutral-600">
        ¿Quieres ver el podio en vivo? Vuelve al{' '}
        <Link href="/#ranking" className="underline hover:text-violet-600 dark:hover:text-violet-400">
          ranking principal
        </Link>
        , o revisa a los campeones de meses anteriores en el{' '}
        <Link href="/salon-de-la-fama" className="underline hover:text-violet-600 dark:hover:text-violet-400">
          Salón de la Fama
        </Link>
        .
      </p>
    </>
  );
}
