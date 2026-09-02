'use client';

import { ExternalLink } from 'lucide-react';
import BidButton from './BidButton';
import CopyLinkButton from './CopyLinkButton';
import ShareButtons from './ShareButtons';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

// El total de puntos y el puesto del grupo se recalculan en vivo con el
// mismo hook que usa la portada — así alguien viendo esta página ve subir
// el contador o cambiar el puesto sin recargar.
export default function GroupDetailCard({ group, initialRankings }: { group: RankingRow; initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const index = rankings.findIndex((r) => r.group_id === group.group_id);
  const rank = index === -1 ? rankings.length : index + 1;
  const totalPoints = index === -1 ? group.total_points : rankings[index].total_points;
  const hasVotes = totalPoints > 0;

  return (
    <div className="border-2 border-pink-600 rounded-2xl p-8 text-center space-y-3 bg-gradient-to-b from-pink-100 to-white dark:from-pink-950/30 dark:to-black">
      <p className="text-xs tracking-[0.3em] text-pink-400 font-semibold">#{rank} DE {rankings.length}</p>
      <div className="w-56 h-56 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">🎤</span>
        )}
      </div>
      <h2 className="text-3xl font-black tracking-tight">{group.group_name}</h2>
      {group.fandom_name && <p className="text-pink-400 font-semibold">♥ {group.fandom_name} ♥</p>}
      {group.bio && <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto text-pretty">{group.bio}</p>}

      <p className="text-xs text-neutral-500 tracking-widest uppercase pt-2">Puntos este mes</p>
      <p className="text-5xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono">
        {totalPoints.toLocaleString('es-MX')} puntos
      </p>

      {hasVotes && (
        <p className="text-sm text-neutral-500">
          Para quitarle este puesto: más de {totalPoints.toLocaleString('es-MX')} puntos este mes.
        </p>
      )}

      <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
        {group.official_url && (
          <a
            href={group.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            Visitar sitio oficial <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <CopyLinkButton slug={group.slug} />
        <ShareButtons slug={group.slug} groupName={group.group_name} />
      </div>

      <div className="pt-2">
        <BidButton groupId={group.group_id} groupName={group.group_name} />
      </div>
    </div>
  );
}
