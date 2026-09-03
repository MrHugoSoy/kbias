'use client';

import Link from 'next/link';
import { Mic2, Zap } from 'lucide-react';
import BidButton from './BidButton';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

// El top 5 ya se ve arriba en RankingBoard — esta lista arranca justo
// después, para no repetir a los mismos grupos dos veces en la portada.
const SKIP_TOP = 5;

function FandomRow({ rank, group, maxPoints }: { rank: number; group: RankingRow; maxPoints: number }) {
  const barPct = maxPoints > 0 ? Math.max(4, Math.round((group.total_points / maxPoints) * 100)) : 4;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-black flex items-center justify-center">
          {rank}
        </span>
        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
          ) : (
            <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
          )}
        </div>
        <Link href={`/grupo/${group.slug}`} className="flex-1 min-w-0 hover:text-violet-600 dark:hover:text-violet-400 transition">
          <p className="font-bold text-sm truncate">{group.group_name}</p>
          {group.fandom_name && <p className="text-xs text-violet-500 truncate">Fandom: {group.fandom_name}</p>}
        </Link>
        <span className="font-mono text-sm text-amber-600 dark:text-amber-400 shrink-0">
          {group.total_points.toLocaleString('es-MX')} pts
        </span>
        <div className="w-16 shrink-0">
          <BidButton compact groupId={group.group_id} groupName={group.group_name} />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full" style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}

// Lista con scroll del resto de los grupos (a partir del puesto 6) — vive
// junto a Actividad en vivo para que cualquier grupo tenga voto directo en
// la portada sin repetir al top 5 que ya se ve en RankingBoard.
export default function FandomsRankingPanel({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const rest = rankings.slice(SKIP_TOP);
  const maxPoints = rankings[0]?.total_points ?? 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-violet-500 fill-violet-500" /> Ranking de fandoms
        </h2>
        <Link href="/estadisticas" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline shrink-0">
          Ver ranking completo
        </Link>
      </div>

      {rest.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-6">Todavía no hay más grupos.</p>
      ) : (
        <div
          className={
            // Misma barra invisible-hasta-hover que Actividad en vivo, para
            // que las dos columnas se vean consistentes.
            'divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-transparent rounded-xl overflow-hidden max-h-[20rem] overflow-y-auto ' +
            '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:theme(colors.violet.400/0.5)_transparent] ' +
            '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
            '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent ' +
            '[&:hover::-webkit-scrollbar-thumb]:bg-violet-400/60'
          }
        >
          {rest.map((r, i) => (
            <FandomRow key={r.group_id} rank={i + SKIP_TOP + 1} group={r} maxPoints={maxPoints} />
          ))}
        </div>
      )}
    </section>
  );
}
