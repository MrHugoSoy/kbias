'use client';

import Link from 'next/link';
import { Crown, Mic2, Plus, Heart } from 'lucide-react';
import BidButton from './BidButton';
import DonorSidebar from './DonorSidebar';
import LogoKW from './icons/LogoKW';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

type FeedItem = {
  id: string;
  group_id: string;
  group_name: string;
  fandom_name: string | null;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_species: string | null;
  avatar_url: string | null;
  xp: number;
  message: string | null;
  points: number;
};

// Tarjeta de ranking: 'lg' es el #1, 'md' el #2/#3, 'sm' el #4-8 (compacta, cabe 5 en una fila).
function RankCard({
  rank,
  group,
  size,
  emphasize,
  orderClassName,
}: {
  rank: number;
  group: RankingRow;
  size: 'lg' | 'md' | 'sm';
  emphasize?: boolean;
  orderClassName?: string;
}) {
  const isThrone = size === 'lg';
  const isCompact = size === 'sm';

  return (
    <div
      className={
        (isThrone
          ? 'relative border-2 border-pink-600 rounded-2xl p-6 text-center space-y-2 bg-gradient-to-b from-pink-100 to-white dark:from-pink-950/30 dark:to-black sm:min-h-[440px] sm:flex sm:flex-col sm:justify-center'
          : isCompact
            ? 'relative border border-neutral-200 dark:border-neutral-800 rounded-xl text-center space-y-1 bg-white dark:bg-neutral-950 flex flex-col justify-center ' +
              (emphasize ? 'p-3 sm:p-4' : 'p-2 sm:p-3')
            : 'relative border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center space-y-2 bg-gradient-to-b from-pink-50 to-white dark:from-pink-950/15 dark:to-black sm:min-h-[390px] sm:flex sm:flex-col sm:justify-center') +
        (orderClassName ? ' ' + orderClassName : '')
      }
    >
      <p
        className={
          (isCompact ? (emphasize ? 'text-xs tracking-[0.2em]' : 'text-[10px] tracking-[0.2em]') : 'text-xs tracking-[0.3em]') +
          ' text-pink-400 font-semibold flex items-center justify-center gap-1'
        }
      >
        {isThrone ? (
          <>
            <Crown className="w-3.5 h-3.5" /> #1 · EL TRONO
          </>
        ) : (
          `#${rank}`
        )}
      </p>
      <Link href={`/grupo/${group.slug}`} className="block">
        <div
          className={
            (isThrone
              ? 'w-32 h-32 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden'
              : isCompact
                ? (emphasize ? 'w-16 h-16' : 'w-12 h-12') +
                  ' mx-auto rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden'
                : 'w-20 h-20 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden') +
            ' relative transition-transform duration-200 hover:z-20 ' +
            (isThrone ? 'hover:scale-150' : isCompact ? 'hover:scale-[3.5]' : 'hover:scale-[2]')
          }
        >
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
          ) : (
            <Mic2
              className={
                (isThrone ? 'w-12 h-12' : isCompact ? (emphasize ? 'w-6 h-6' : 'w-5 h-5') : 'w-8 h-8') +
                ' text-neutral-500 dark:text-neutral-600'
              }
            />
          )}
        </div>
        <h2
          className={
            'hover:underline ' +
            (isThrone
              ? 'text-3xl font-black tracking-tight'
              : isCompact
                ? (emphasize ? 'text-sm' : 'text-xs') + ' font-bold truncate'
                : 'text-lg font-bold')
          }
        >
          {group.group_name}
        </h2>
      </Link>
      {group.fandom_name && !isCompact && (
        <p className="text-pink-400 text-sm font-semibold flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 fill-current" /> {group.fandom_name} <Heart className="w-3 h-3 fill-current" />
        </p>
      )}
      {group.bio && !isCompact && <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 text-pretty">{group.bio}</p>}
      <p
        className={
          isThrone
            ? 'text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono'
            : isCompact
              ? (emphasize ? 'text-base' : 'text-sm') + ' font-bold text-amber-400 font-mono'
              : 'text-xl font-bold text-amber-400 font-mono'
        }
      >
        {group.total_points.toLocaleString('es-MX')} {group.total_points === 1 ? 'punto' : 'puntos'}
      </p>
      {!isCompact && (
        <p className="text-xs text-neutral-500">
          {group.total_points === 0 ? 'Nadie le ha dado puntos aún' : '¡Dale puntos para que suba más!'}
        </p>
      )}
      {!isCompact && group.total_points > 0 && (
        <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
          Para quitarle el puesto: +{group.total_points.toLocaleString('es-MX')} puntos
        </p>
      )}
      <div className={isCompact ? 'pt-0.5' : 'pt-1'}>
        <BidButton groupId={group.group_id} groupName={group.group_name} compact={isCompact} />
      </div>
    </div>
  );
}

// Puesto todavía sin reclamar — mantiene el hueco visible en vez de desaparecer.
function EmptySlotCard({
  rank,
  size,
  emphasize,
  orderClassName,
}: {
  rank: number;
  size: 'lg' | 'md' | 'sm';
  emphasize?: boolean;
  orderClassName?: string;
}) {
  const isThrone = size === 'lg';
  const isCompact = size === 'sm';

  return (
    <div
      className={
        (isThrone
          ? 'relative border-2 border-dashed border-pink-700/60 rounded-2xl p-6 text-center space-y-2 bg-pink-600/5 hover:border-pink-500 hover:bg-pink-600/10 transition sm:min-h-[440px] sm:flex sm:flex-col sm:justify-center'
          : isCompact
            ? 'relative border border-dashed border-pink-800/50 rounded-xl text-center space-y-1 bg-pink-600/5 hover:border-pink-500 transition flex flex-col justify-center ' +
              (emphasize ? 'p-3 sm:p-4' : 'p-2 sm:p-3')
            : 'relative border border-dashed border-pink-800/50 rounded-2xl p-5 text-center space-y-2 bg-gradient-to-b from-pink-100/60 to-pink-600/5 dark:from-pink-950/20 dark:to-black hover:border-pink-500 transition sm:h-[390px] sm:flex sm:flex-col sm:justify-center') +
        (orderClassName ? ' ' + orderClassName : '')
      }
    >
      <p
        className={
          isCompact
            ? (emphasize ? 'text-xs' : 'text-[10px]') + ' tracking-[0.2em] text-pink-500/70 font-bold'
            : 'text-xs tracking-[0.3em] text-pink-500/70 font-bold'
        }
      >
        #{rank}
      </p>
      <div
        className={
          isThrone
            ? 'w-32 h-32 mx-auto rounded-full border-2 border-dashed border-pink-600/60 flex items-center justify-center animate-pulse'
            : isCompact
              ? (emphasize ? 'w-16 h-16' : 'w-12 h-12') +
                ' mx-auto rounded-full border border-dashed border-pink-700/60 flex items-center justify-center'
              : 'w-20 h-20 mx-auto rounded-full border-2 border-dashed border-pink-700/60 flex items-center justify-center'
        }
      >
        <Plus className={(isThrone ? 'w-10 h-10' : isCompact ? (emphasize ? 'w-5 h-5' : 'w-4 h-4') : 'w-7 h-7') + ' text-pink-500'} />
      </div>
      <p
        className={
          isThrone
            ? 'text-xl font-black text-pink-400'
            : isCompact
              ? (emphasize ? 'text-xs' : 'text-[10px]') + ' font-bold text-pink-400'
              : 'text-sm font-bold text-pink-400'
        }
      >
        ¡Disponible!
      </p>
      {!isCompact && <p className="text-xs text-neutral-500">Sé el primero en reclamarlo</p>}
    </div>
  );
}

export default function RankingBoard({
  initialRankings,
  feed,
  currentMonthLabel,
  nextMonthLabel,
}: {
  initialRankings: RankingRow[];
  feed: FeedItem[];
  currentMonthLabel: string;
  nextMonthLabel: string;
}) {
  const rankings = useLiveRankings(initialRankings);

  // Solo los grupos que ya recibieron al menos un voto ocupan un puesto en el podio.
  // Sin eso, se llenaría el top 8 con grupos en 0 votos solo por orden alfabético.
  const bidded = rankings.filter((r) => r.total_points > 0);
  const unbidded = rankings.filter((r) => r.total_points === 0);

  const top3 = bidded.slice(0, 3);
  const midFive = bidded.slice(3, 8);
  const rest = [...bidded.slice(8), ...unbidded];
  // Solo los primeros `rankedOverflowCount` de `rest` tienen votos reales (rank #9+ legítimo);
  // el resto son bandas sin votos y no deben mostrar número de puesto.
  const rankedOverflowCount = Math.max(bidded.length - 8, 0);

  return (
    <section id="ranking" className="space-y-4">
      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
        Ranking de {currentMonthLabel} — se reinicia el 1 de {nextMonthLabel}
      </p>

      {top3.length === 0 && (
        <div className="text-center py-6 space-y-2">
          <LogoKW className="w-24 h-24 mx-auto text-pink-500 fill-pink-500/20 animate-bounce" />
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-pink-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(236,72,153,0.35)]">
            El trono está vacío
          </h2>
          <p className="text-pink-500 dark:text-pink-400 text-xs font-semibold tracking-[0.3em] uppercase">
            ✦ Sé el primero en reclamarlo ✦
          </p>
        </div>
      )}

      <div className="relative grid sm:grid-cols-[1fr_1.2fr_1fr] sm:items-end gap-4">
        <div className="hidden sm:block absolute inset-0 bg-pink-600/10 blur-3xl rounded-full -z-10" />
        {[0, 1, 2].map((i) => {
          const r = top3[i];
          const orderClassName = i === 0 ? 'sm:order-2' : i === 1 ? 'sm:order-1' : 'sm:order-3';
          if (!r) return <EmptySlotCard key={i} rank={i + 1} size={i === 0 ? 'lg' : 'md'} orderClassName={orderClassName} />;
          return (
            <RankCard
              key={r.group_id}
              rank={i + 1}
              group={r}
              size={i === 0 ? 'lg' : 'md'}
              orderClassName={orderClassName}
            />
          );
        })}
      </div>

      {/* Móvil: #4 y #5 un poco más grandes arriba, #6-#8 abajo. Desde sm: los 5 en una sola fila, mismo tamaño. */}
      <div className="sm:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => {
            const r = midFive[i];
            if (!r) return <EmptySlotCard key={i} rank={i + 4} size="sm" emphasize />;
            return <RankCard key={r.group_id} rank={i + 4} group={r} size="sm" emphasize />;
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((i) => {
            const r = midFive[i];
            if (!r) return <EmptySlotCard key={i} rank={i + 4} size="sm" />;
            return <RankCard key={r.group_id} rank={i + 4} group={r} size="sm" />;
          })}
        </div>
      </div>
      <div className="hidden sm:grid sm:grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((i) => {
          const r = midFive[i];
          if (!r) return <EmptySlotCard key={i} rank={i + 4} size="sm" />;
          return <RankCard key={r.group_id} rank={i + 4} group={r} size="sm" />;
        })}
      </div>

      {/* Debajo del top 8: sidebar de donadores en vivo + resto de las bandas, uno al lado del otro */}
      <div className="flex gap-6">
        <aside id="historial-desktop" className="hidden lg:block w-64 shrink-0 sticky top-8 self-start">
          <DonorSidebar initialItems={feed} />
        </aside>

        {rest.length > 0 && (
          <div className="flex-1 min-w-0 space-y-2">
            {rest.map((r, i) => (
              <div key={r.group_id} className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  {i < rankedOverflowCount && (
                    <span className="text-neutral-600 font-mono text-sm w-6 text-center">#{i + 9}</span>
                  )}
                  <Link href={`/grupo/${r.slug}`} className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center relative transition-transform duration-200 hover:scale-[3.5] hover:z-20">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                    ) : (
                      <Mic2 className="w-5 h-5 text-neutral-500 dark:text-neutral-600" />
                    )}
                  </Link>
                  <div>
                    <Link href={`/grupo/${r.slug}`} className="font-bold hover:underline">
                      {r.group_name}
                    </Link>
                    <p className="text-xs text-pink-400">{r.fandom_name}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Puntos recibidos</p>
                  <p className="text-pink-400 font-mono text-sm">
                    {r.total_points > 0 ? `${r.total_points.toLocaleString('es-MX')} puntos` : 'Sin puntos aún'}
                  </p>
                  {r.total_points > 0 && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
                      Quítaselo: +{r.total_points.toLocaleString('es-MX')} puntos
                    </p>
                  )}
                </div>
                <BidButton groupId={r.group_id} groupName={r.group_name} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
