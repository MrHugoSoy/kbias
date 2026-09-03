'use client';

import { useState } from 'react';
import { BadgeCheck, ExternalLink, Mic2 } from 'lucide-react';
import BidButton from './BidButton';
import CopyLinkButton from './CopyLinkButton';
import ShareButtons from './ShareButtons';
import RankChange from './RankChange';
import Sparkline from './Sparkline';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

type Tab = 'info' | 'stats';

type StatsExtra = {
  totalVotesAllTime: number;
  votesToday: number;
  dailySeries: number[];
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  );
}

function StatBlock({ label, value, data }: { label: string; value: string; data?: number[] }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{value}</p>
      {data && <Sparkline data={data} />}
    </div>
  );
}

// El total de puntos y el puesto del grupo se recalculan en vivo con el
// mismo hook que usa la portada — así alguien viendo esta página ve subir
// el contador o cambiar el puesto sin recargar. Las estadísticas
// históricas (votos totales, de hoy, mejor puesto) llegan como props desde
// el servidor — no cambian tan rápido como para justificar su propia
// suscripción en vivo.
export default function GroupDetailCard({
  group,
  initialRankings,
  stats,
}: {
  group: RankingRow;
  initialRankings: RankingRow[];
  stats: StatsExtra;
}) {
  const rankings = useLiveRankings(initialRankings);
  const index = rankings.findIndex((r) => r.group_id === group.group_id);
  const live = index === -1 ? group : rankings[index];
  const rank = index === -1 ? rankings.length : index + 1;
  const [tab, setTab] = useState<Tab>('info');

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden">
        <div className="h-36 sm:h-52 bg-neutral-100 dark:bg-neutral-900">
          {group.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt="" aria-hidden className="w-full h-full object-cover blur-[1px] scale-105" />
          )}
        </div>
        <div className="absolute -bottom-8 left-4 sm:left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-neutral-950 overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
          ) : (
            <Mic2 className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />
          )}
        </div>
      </div>

      <div className="pt-9 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
            {group.group_name}
            {group.claimed_by_fan && (
              <BadgeCheck className="w-5 h-5 text-violet-500" aria-label="Perfil verificado" />
            )}
          </h1>
          {group.fandom_name && <p className="text-violet-500 font-semibold text-sm">♥ {group.fandom_name} ♥</p>}
          <p className="text-sm text-neutral-500 mt-1">
            {live.total_points.toLocaleString('es-MX')} {live.total_points === 1 ? 'punto' : 'puntos'} este mes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BidButton groupId={group.group_id} groupName={group.group_name} />
          <CopyLinkButton slug={group.slug} />
          <ShareButtons slug={group.slug} groupName={group.group_name} />
        </div>
      </div>

      {group.bio && <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">{group.bio}</p>}

      {/* Pestañas — Noticias/Miembros/Logros necesitan datos que hoy no
          existen (artículos, roster, insignias), así que quedan visibles
          pero deshabilitadas en vez de fingir contenido. */}
      <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setTab('info')}
          className={
            'pb-2 shrink-0 ' +
            (tab === 'info' ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400' : 'text-neutral-500')
          }
        >
          Información
        </button>
        <span className="pb-2 shrink-0 text-neutral-400 dark:text-neutral-600 cursor-not-allowed" title="Próximamente">
          Noticias
        </span>
        <span className="pb-2 shrink-0 text-neutral-400 dark:text-neutral-600 cursor-not-allowed" title="Próximamente">
          Miembros
        </span>
        <span className="pb-2 shrink-0 text-neutral-400 dark:text-neutral-600 cursor-not-allowed" title="Próximamente">
          Logros
        </span>
        <button
          onClick={() => setTab('stats')}
          className={
            'pb-2 shrink-0 ' +
            (tab === 'stats' ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400' : 'text-neutral-500')
          }
        >
          Estadísticas
        </button>
      </div>

      {tab === 'info' ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Posición en ranking</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">#{rank}</p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Cambio de hoy</p>
            <div className="mt-1">
              <RankChange current={rank} previous={live.rank_snapshot_value} />
            </div>
          </div>
          {group.fandom_name && <InfoField label="Fandom" value={group.fandom_name} />}
          {group.genre && <InfoField label="Género" value={group.genre} />}
          {group.country && <InfoField label="País" value={group.country} />}
          {group.debut_date && (
            <InfoField
              label="Debut"
              value={new Date(group.debut_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
            />
          )}
          {group.official_url && (
            <a
              href={group.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 flex items-center justify-between hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
            >
              <span>
                <span className="block text-xs text-neutral-500 uppercase tracking-wide">Sitio oficial</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">Visitar</span>
              </span>
              <ExternalLink className="w-4 h-4 text-violet-500" />
            </a>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Votos totales" value={stats.totalVotesAllTime.toLocaleString('es-MX')} data={stats.dailySeries} />
          <StatBlock label="Votos hoy" value={stats.votesToday.toLocaleString('es-MX')} />
          <StatBlock label="Mejor posición" value={group.best_rank ? `#${group.best_rank}` : '—'} />
        </div>
      )}
    </div>
  );
}
