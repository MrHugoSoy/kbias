'use client';

import Link from 'next/link';
import { Mic2 } from 'lucide-react';
import BidButton from './BidButton';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

// Debe coincidir con RANK_OFFSET + CARD_COUNT de RankingBoard — ahí se ven
// los puestos 5-9 como tarjetas (el 1-4 ya está en el Hero), esta lista
// arranca justo después para no repetir a nadie.
const SKIP_TOP = 9;

function RestRow({ rank, group, maxPoints }: { rank: number; group: RankingRow; maxPoints: number }) {
  const barPct = maxPoints > 0 ? Math.max(4, Math.round((group.total_points / maxPoints) * 100)) : 4;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-black flex items-center justify-center">
        {rank}
      </span>
      <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
        ) : (
          <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/grupo/${group.slug}`} className="min-w-0 hover:text-violet-600 dark:hover:text-violet-400 transition">
            <p className="font-bold text-sm truncate">{group.group_name}</p>
            {group.fandom_name && <p className="text-xs text-violet-500 truncate">Fandom: {group.fandom_name}</p>}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-sm text-amber-600 dark:text-amber-400 w-16 text-right">
              {group.total_points.toLocaleString('es-MX')} pts
            </span>
            <div className="w-16">
              <BidButton compact floatingMessage groupId={group.group_id} groupName={group.group_name} />
            </div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full" style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// Lista con scroll del resto de los grupos (a partir del puesto 10) — vive
// junto a Actividad en vivo para que cualquier grupo tenga voto directo en
// la portada sin repetir a los que ya se ven en el Hero y en RankingBoard.
export default function RestRankingList({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const rest = rankings.slice(SKIP_TOP);
  const maxPoints = rankings[0]?.total_points ?? 0;

  if (rest.length === 0) return null;

  return (
    // El borde redondeado vive en este wrapper (que no scrollea) y el hijo
    // de adentro es el único que scrollea — en algunos navegadores,
    // combinar border-radius + overflow-y-auto en el MISMO elemento no
    // recorta el contenido de forma consistente (las esquinas se ven
    // cuadradas al hacer scroll). Separar ambos responsabilidades lo
    // vuelve confiable en cualquier navegador.
    <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl overflow-hidden">
      <div
        className={
          'divide-y divide-neutral-200 dark:divide-neutral-900 max-h-[22rem] overflow-y-auto ' +
          '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:theme(colors.violet.400/0.5)_transparent] ' +
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent ' +
          '[&:hover::-webkit-scrollbar-thumb]:bg-violet-400/60'
        }
      >
        {rest.map((r, i) => (
          <RestRow key={r.group_id} rank={i + SKIP_TOP + 1} group={r} maxPoints={maxPoints} />
        ))}
      </div>
    </div>
  );
}
