'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Calendar,
  ExternalLink,
  Globe,
  Info,
  Mic2,
  Newspaper,
  Percent,
  Swords,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import BidButton from './BidButton';
import CopyLinkButton from './CopyLinkButton';
import ShareButtons from './ShareButtons';
import RankChange from './RankChange';
import Sparkline from './Sparkline';
import GroupComments, { type Comment } from './GroupComments';
import { useLiveRankings } from '@/lib/useLiveRankings';
import { useCountdown } from '@/lib/useCountdown';
import type { NewsPost, RankingRow, GroupMember, GroupBattleForGroup } from '@/lib/types';

type StatsExtra = {
  totalVotesAllTime: number;
  votesToday: number;
  dailySeries: number[];
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
      {children}
    </span>
  );
}

// Igual que Tag, pero para encima de la foto de portada — un fondo oscuro
// semitransparente en vez del gris claro, que se perdería sobre la imagen.
function BannerTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-white">
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
      <Icon className="w-4 h-4 text-violet-500" />
      <p className="text-xl font-black font-mono">{value}</p>
      <p className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  );
}

function MemberImage({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Mic2 className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
      )}
    </div>
  );
}

function MemberCard({ member }: { member: GroupMember }) {
  return (
    <a
      href={member.social_url ?? undefined}
      target={member.social_url ? '_blank' : undefined}
      rel={member.social_url ? 'noopener noreferrer' : undefined}
      className={'text-center space-y-1.5 ' + (member.social_url ? 'hover:opacity-80 transition' : 'cursor-default')}
    >
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-violet-200 dark:border-violet-900">
        <MemberImage image={member.image_url} name={member.name} />
      </div>
      <p className="text-sm font-bold">{member.name}</p>
      {member.role && <p className="text-xs text-neutral-500">{member.role}</p>}
    </a>
  );
}

function battlePct(a: number, b: number) {
  const total = a + b;
  return total > 0 ? Math.round((a / total) * 100) : 50;
}

function timeAgoLong(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function ResultBadge({ battle }: { battle: GroupBattleForGroup }) {
  if (battle.my_points === battle.opponent_points) {
    return <span className="text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full">Empate</span>;
  }
  const won = battle.my_points > battle.opponent_points;
  return (
    <span
      className={
        'text-xs font-bold px-2 py-0.5 rounded-full ' +
        (won ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-red-500 bg-red-50 dark:bg-red-950/30')
      }
    >
      {won ? 'Victoria' : 'Derrota'}
    </span>
  );
}

function BattleRow({ battle }: { battle: GroupBattleForGroup }) {
  const pct = battlePct(battle.my_points, battle.opponent_points);
  return (
    <Link
      href={`/grupo/${battle.opponent_slug}`}
      className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
        <MemberImage image={battle.opponent_image} name={battle.opponent_name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">vs {battle.opponent_name}</p>
        <p className="text-xs text-neutral-500">
          {battle.status === 'finished'
            ? `${pct}% · ${timeAgoLong(battle.ends_at)}`
            : battle.status === 'active'
              ? 'En curso'
              : 'Próxima'}
        </p>
      </div>
      {battle.status === 'finished' ? (
        <ResultBadge battle={battle} />
      ) : (
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0">
          {battle.status === 'active' ? 'En curso' : 'Próxima'}
        </span>
      )}
    </Link>
  );
}

function NextBattleWidget({ battle }: { battle: GroupBattleForGroup }) {
  const { hours, minutes, seconds } = useCountdown(battle.status === 'active' ? battle.ends_at : battle.starts_at);
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
  const days = Math.floor(hours / 24);

  return (
    <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-2xl p-4 text-white space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-white/90">
        {battle.status === 'active' ? 'Batalla en curso' : 'Próxima batalla'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 shrink-0">
          <MemberImage image={battle.opponent_image} name={battle.opponent_name} />
        </div>
        <span className="font-black">VS</span>
        <p className="font-bold truncate">{battle.opponent_name}</p>
      </div>
      <div className="flex items-center justify-center gap-1 font-mono font-black text-lg">
        {days > 0 ? (
          <span>
            {days} {days === 1 ? 'día' : 'días'}
          </span>
        ) : (
          <>
            <span className="bg-white/20 rounded-lg px-2 py-1">{pad(hours)}</span>:
            <span className="bg-white/20 rounded-lg px-2 py-1">{pad(minutes)}</span>:
            <span className="bg-white/20 rounded-lg px-2 py-1">{pad(seconds)}</span>
          </>
        )}
      </div>
      <Link
        href="/batallas"
        className="block text-center bg-white text-violet-600 text-sm font-bold px-3 py-2 rounded-lg hover:opacity-90 transition"
      >
        Ver batalla
      </Link>
    </div>
  );
}

// Sin foto de portada: solo un avatar circular + los datos del grupo, igual
// que el resto del sitio (sin depender de un banner que haya que subir a
// mano). "Batallas ganadas" y "% de victorias" salen de group_battles reales
// — no hay seguidores ni logros con números inventados porque esa
// información no existe todavía en la base.
export default function GroupDetailCard({
  group,
  initialRankings,
  stats,
  newsPosts,
  members,
  battles,
  comments,
}: {
  group: RankingRow;
  initialRankings: RankingRow[];
  stats: StatsExtra;
  newsPosts: NewsPost[];
  members: GroupMember[];
  battles: GroupBattleForGroup[];
  comments: Comment[];
}) {
  const rankings = useLiveRankings(initialRankings);
  const index = rankings.findIndex((r) => r.group_id === group.group_id);
  const live = index === -1 ? group : rankings[index];
  const rank = index === -1 ? rankings.length : index + 1;

  const finishedBattles = battles.filter((b) => b.status === 'finished').sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
  const won = finishedBattles.filter((b) => b.my_points > b.opponent_points).length;
  const lost = finishedBattles.filter((b) => b.my_points < b.opponent_points).length;
  const winPct = finishedBattles.length > 0 ? Math.round((won / finishedBattles.length) * 100) : null;
  const nextBattle =
    battles.find((b) => b.status === 'active') ??
    [...battles.filter((b) => b.status === 'upcoming')].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ??
    null;
  const otherBattles = [...battles]
    .filter((b) => b.battle_id !== nextBattle?.battle_id)
    .sort((a, b) => new Date(b.status === 'finished' ? b.ends_at : b.starts_at).getTime() - new Date(a.status === 'finished' ? a.ends_at : a.starts_at).getTime());

  return (
    <div className="space-y-5">
      {/* Portada — la misma foto del grupo de fondo (no hay un campo de
          banner aparte), con un degradado oscuro a la izquierda para que el
          nombre y los tags se puedan leer encima. */}
      <div className="relative rounded-2xl overflow-hidden bg-neutral-950 min-h-[15rem] sm:min-h-[16rem]">
        {group.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-[80%_15%]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 sm:via-neutral-950/60 to-neutral-950/20 sm:to-transparent" />

        <div className="relative h-full p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-violet-500 border-4 border-neutral-950 overflow-hidden bg-neutral-900 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
            {group.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
            ) : (
              <Mic2 className="w-10 h-10 text-neutral-500" />
            )}
            {group.claimed_by_fan && (
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 border-2 border-neutral-950 flex items-center justify-center">
                <BadgeCheck className="w-4 h-4 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{group.group_name}</h1>
            {group.agency && <p className="text-sm text-white/70">{group.agency}</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {nextBattle?.status === 'active' && (
                <BannerTag>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En batalla
                </BannerTag>
              )}
              {group.group_type && <BannerTag>{group.group_type}</BannerTag>}
              {group.debut_date && (
                <BannerTag>
                  <Calendar className="w-3 h-3" /> Debut {new Date(group.debut_date).getUTCFullYear()}
                </BannerTag>
              )}
            </div>
            {group.bio && <p className="text-sm text-white/80 max-w-lg line-clamp-2 mx-auto sm:mx-0">{group.bio}</p>}
          </div>

          <div className="shrink-0 mx-auto sm:mx-0">
            <BidButton groupId={group.group_id} groupName={group.group_name} />
          </div>
        </div>
      </div>

      {/* Fila secundaria — solo acciones (el resto de los datos del grupo
          vive una sola vez, en "Sobre el grupo" más abajo). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {group.official_url ? (
          <a
            href={group.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:text-violet-500 dark:hover:text-violet-400 inline-flex items-center gap-1"
          >
            <Globe className="w-3 h-3" /> Sitio oficial <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 shrink-0">
          <CopyLinkButton slug={group.slug} />
          <ShareButtons slug={group.slug} groupName={group.group_name} />
        </div>
      </div>

      {/* Stats reales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Vote} label="Puntos este mes" value={live.total_points.toLocaleString('es-MX')} />
        <StatCard icon={Trophy} label="Ranking actual" value={`#${rank}`} />
        <StatCard icon={Swords} label="Batallas ganadas" value={String(won)} />
        <StatCard icon={Percent} label="% victorias" value={winPct !== null ? `${winPct}%` : '—'} />
      </div>

      {/* Dos columnas: info/miembros/batallas a la izquierda, estadísticas
          y la próxima batalla en una barra lateral a la derecha — igual que
          el resto de páginas del sitio que usan este patrón (p. ej. /grupos). */}
      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* Sobre el grupo */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-violet-500" /> Sobre {group.group_name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.debut_date && (
                <InfoField
                  label="Debut"
                  value={new Date(group.debut_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                />
              )}
              {group.country && <InfoField label="País" value={group.country} />}
              {group.genre && <InfoField label="Género" value={group.genre} />}
              {group.fandom_name && <InfoField label="Fandom" value={group.fandom_name} />}
            </div>
          </section>

          {/* Miembros */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" /> Miembros ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-neutral-500">Todavía no cargamos a los integrantes de {group.group_name}.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {members.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            )}
          </section>

          {/* Batallas */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Swords className="w-5 h-5 text-violet-500" /> Batallas ({battles.length})
            </h2>
            {otherBattles.length === 0 ? (
              <p className="text-sm text-neutral-500">
                {battles.length === 0 ? `${group.group_name} todavía no tiene batallas.` : 'No hay más batallas por ahora.'}
              </p>
            ) : (
              <div className="space-y-2">
                {otherBattles.map((b) => (
                  <BattleRow key={b.battle_id} battle={b} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Barra lateral */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-500" /> Estadísticas del grupo
            </h3>
            {/* Puntos/ranking/batallas ganadas/% victorias ya están arriba,
                en las tarjetas resumen — aquí solo lo que no se repite. */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Votos totales</span>
                <span className="font-bold">{stats.totalVotesAllTime.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Batallas perdidas</span>
                <span className="font-bold">{lost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Mejor posición</span>
                <span className="font-bold">{group.best_rank ? `#${group.best_rank}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Cambio de hoy</span>
                <RankChange current={rank} previous={live.rank_snapshot_value} />
              </div>
            </div>
            <Sparkline data={stats.dailySeries} />
          </div>

          {nextBattle && <NextBattleWidget battle={nextBattle} />}
        </div>
      </div>

      {/* Noticias */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-violet-500" /> Noticias ({newsPosts.length})
        </h2>
        {newsPosts.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay noticias de {group.group_name}.</p>
        ) : (
          <div className="space-y-3">
            {newsPosts.map((post) => (
              <Link
                key={post.id}
                href={`/noticias/${post.id}`}
                className="block bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                <p className="font-bold text-sm">{post.title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">{post.body}</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-600 mt-1">
                  {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Comunidad */}
      <section>
        <GroupComments groupId={group.group_id} initialComments={comments} />
      </section>
    </div>
  );
}
