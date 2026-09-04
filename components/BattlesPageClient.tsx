'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Flame, Mic2, Share2, Swords, Clock, Hourglass, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useCountdown } from '@/lib/useCountdown';
import AuthModal from './AuthModal';
import VoteMessageModal from './VoteMessageModal';
import type { GroupBattle } from '@/lib/types';

type Tab = 'todas' | 'active' | 'upcoming' | 'finished';

function GroupThumb({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Mic2 className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
      )}
    </div>
  );
}

function daysUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.max(1, Math.round(ms / 86_400_000));
  return `Inicia en ${days} ${days === 1 ? 'día' : 'días'}`;
}

function timeLeftShort(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Terminada';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

function pct(a: number, b: number) {
  const total = a + b;
  const pctA = total > 0 ? Math.round((a / total) * 100) : 50;
  return { pctA, pctB: 100 - pctA };
}

export default function BattlesPageClient() {
  const [battles, setBattles] = useState<GroupBattle[] | null>(null);
  const [tab, setTab] = useState<Tab>('todas');
  const [showAuth, setShowAuth] = useState(false);
  const [voteTarget, setVoteTarget] = useState<{ battleId: string; groupId: string; label: string } | null>(null);
  const [pointsRemaining, setPointsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<(() => void) | null>(null);
  const [shared, setShared] = useState(false);

  async function loadBattles() {
    try {
      const res = await fetch('/api/group-battles');
      const data = await res.json();
      setBattles(data.battles ?? []);
    } catch {
      // Sondeo cada 60s — un fallo de red pasajero no debe romper la página.
    }
  }

  useEffect(() => {
    loadBattles();
    const id = setInterval(loadBattles, 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleVoteClick(battleId: string, groupId: string, label: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPendingAfterAuth(() => () => handleVoteClick(battleId, groupId, label));
      setShowAuth(true);
      return;
    }
    const res = await authFetch('/api/vote');
    if (!res.ok) {
      // Un 401 significa que la sesión guardada ya no es válida — no que ya
      // gastó sus puntos, así que hay que pedirle iniciar sesión de nuevo en
      // vez de abrir el modal con "0 puntos" (lo haría ver sin puntos falsamente).
      if (res.status === 401) {
        setPendingAfterAuth(() => () => handleVoteClick(battleId, groupId, label));
        setShowAuth(true);
      }
      return;
    }
    const data2 = await res.json();
    setPointsRemaining(data2.pointsRemaining ?? 0);
    setVoteTarget({ battleId, groupId, label });
  }

  async function confirmVote(message: string, points: number) {
    if (!voteTarget) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/group-battle-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId: voteTarget.battleId, groupId: voteTarget.groupId, points, message: message || undefined }),
      });
      if (res.ok) {
        setVoteTarget(null);
        loadBattles();
      }
    } finally {
      setLoading(false);
    }
  }

  const active = useMemo(() => (battles ?? []).filter((b) => b.status === 'active'), [battles]);
  const upcoming = useMemo(() => (battles ?? []).filter((b) => b.status === 'upcoming'), [battles]);
  const finished = useMemo(() => (battles ?? []).filter((b) => b.status === 'finished'), [battles]);

  const featured = active[0] ?? null;
  const restActive = active.slice(1);

  if (battles === null) {
    return <p className="text-sm text-neutral-500 text-center py-10">Cargando batallas...</p>;
  }

  if (battles.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Swords className="w-12 h-12 mx-auto text-violet-500" />
        <p className="text-neutral-500 dark:text-neutral-400">Todavía no hay batallas cargadas.</p>
      </div>
    );
  }

  const showActive = tab === 'todas' || tab === 'active';
  const showUpcoming = tab === 'todas' || tab === 'upcoming';
  const showFinished = tab === 'todas' || tab === 'finished';

  return (
    <div className="space-y-8">
      {/* Pestañas */}
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-1.5 flex flex-wrap gap-1 text-sm font-bold">
        {([
          ['todas', 'Todas', Swords],
          ['active', 'En curso', Flame],
          ['upcoming', 'Próximas', Clock],
          ['finished', 'Finalizadas', CheckCircle2],
        ] as [Tab, string, typeof Swords][]).map(([value, label, Icon]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={
              'flex-1 min-w-[7rem] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition ' +
              (tab === value
                ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white'
                : 'text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400')
            }
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {showActive && active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Batallas en curso
          </h2>

          {featured && (
            <FeaturedBattle
              battle={featured}
              onShare={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/batallas`);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
              }}
              shared={shared}
              onVote={handleVoteClick}
            />
          )}

          {restActive.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {restActive.map((b) => (
                <CompactBattleCard key={b.battle_id} battle={b} onVote={handleVoteClick} />
              ))}
            </div>
          )}
        </section>
      )}

      {showUpcoming && upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" /> Batallas próximas
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcoming.map((b) => (
              <UpcomingBattleCard key={b.battle_id} battle={b} />
            ))}
          </div>
        </section>
      )}

      {showFinished && finished.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-neutral-400" /> Batallas finalizadas
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {finished.map((b) => (
              <FinishedBattleCard key={b.battle_id} battle={b} />
            ))}
          </div>
        </section>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false); setPendingAfterAuth(null); }}
          onAuthed={() => {
            setShowAuth(false);
            pendingAfterAuth?.();
            setPendingAfterAuth(null);
          }}
        />
      )}
      {voteTarget && (
        <VoteMessageModal
          groupName={voteTarget.label}
          pointsRemaining={pointsRemaining}
          loading={loading}
          onClose={() => setVoteTarget(null)}
          onConfirm={confirmVote}
        />
      )}
    </div>
  );
}

function FeaturedBattle({
  battle,
  onShare,
  shared,
  onVote,
}: {
  battle: GroupBattle;
  onShare: () => void;
  shared: boolean;
  onVote: (battleId: string, groupId: string, label: string) => void;
}) {
  const { pctA, pctB } = pct(battle.group_a_points, battle.group_b_points);
  const { hours, minutes, seconds } = useCountdown(battle.ends_at);
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-5 sm:p-6 grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
      {/* Lado A */}
      <div className="space-y-2">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <GroupThumb image={battle.group_a_image} name={battle.group_a_name} />
          <span className="absolute -bottom-3 left-3 w-9 h-9 rounded-full bg-violet-600 border-2 border-white dark:border-neutral-950 flex items-center justify-center shadow-lg">
            <Crown className="w-4 h-4 text-white" />
          </span>
        </div>
        <div className="pt-2 text-center">
          <p className="font-black">{battle.group_a_name}</p>
          {battle.group_a_agency && <p className="text-xs text-neutral-500">{battle.group_a_agency}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-black text-violet-600 dark:text-violet-400 shrink-0">{pctA}%</span>
            <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-violet-600" style={{ width: `${pctA}%` }} />
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {battle.group_a_points.toLocaleString('es-MX')} {battle.group_a_points === 1 ? 'voto' : 'votos'}
          </p>
        </div>
        <button
          onClick={() => onVote(battle.battle_id, battle.group_a_id, `${battle.group_a_name} vs ${battle.group_b_name}`)}
          className="w-full text-xs font-bold border border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 rounded-lg py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
        >
          Votar por {battle.group_a_name}
        </button>
      </div>

      {/* Centro */}
      <div className="flex flex-col items-center gap-2 order-first md:order-none">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white" /> EN CURSO
        </span>
        <span className="text-3xl font-black bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
          VS
        </span>
        <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Termina en</p>
        <div className="flex items-center gap-1 font-mono font-black text-xl">
          <span className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-2 py-1">{pad(hours)}</span>:
          <span className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-2 py-1">{pad(minutes)}</span>:
          <span className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-2 py-1">{pad(seconds)}</span>
        </div>
        <div className="flex gap-3 text-[10px] text-neutral-400 uppercase tracking-wide">
          <span>Hrs</span>
          <span>Min</span>
          <span>Seg</span>
        </div>
        <p className="text-[11px] text-neutral-400 text-center max-w-[10rem]">
          Elige un lado para votar ↔
        </p>
        <button onClick={onShare} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-500 transition">
          <Share2 className="w-3.5 h-3.5" /> {shared ? '¡Copiado!' : 'Compartir'}
        </button>
      </div>

      {/* Lado B */}
      <div className="space-y-2">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <GroupThumb image={battle.group_b_image} name={battle.group_b_name} />
          <span className="absolute -bottom-3 right-3 w-9 h-9 rounded-full bg-pink-500 border-2 border-white dark:border-neutral-950 flex items-center justify-center shadow-lg">
            <Crown className="w-4 h-4 text-white" />
          </span>
        </div>
        <div className="pt-2 text-center">
          <p className="font-black">{battle.group_b_name}</p>
          {battle.group_b_agency && <p className="text-xs text-neutral-500">{battle.group_b_agency}</p>}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-pink-500 ml-auto" style={{ width: `${pctB}%` }} />
            </div>
            <span className="text-lg font-black text-pink-500 shrink-0">{pctB}%</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {battle.group_b_points.toLocaleString('es-MX')} {battle.group_b_points === 1 ? 'voto' : 'votos'}
          </p>
        </div>
        <button
          onClick={() => onVote(battle.battle_id, battle.group_b_id, `${battle.group_b_name} vs ${battle.group_a_name}`)}
          className="w-full text-xs font-bold border border-pink-300 dark:border-pink-900 text-pink-500 rounded-lg py-1.5 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition"
        >
          Votar por {battle.group_b_name}
        </button>
      </div>
    </div>
  );
}

function CompactBattleCard({ battle, onVote }: { battle: GroupBattle; onVote: (battleId: string, groupId: string, label: string) => void }) {
  const { pctA, pctB } = pct(battle.group_a_points, battle.group_b_points);
  const totalVotes = battle.group_a_points + battle.group_b_points;

  return (
    <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden">
      <div className="relative grid grid-cols-2">
        <button onClick={() => onVote(battle.battle_id, battle.group_a_id, `${battle.group_a_name} vs ${battle.group_b_name}`)} className="aspect-square">
          <GroupThumb image={battle.group_a_image} name={battle.group_a_name} />
        </button>
        <button onClick={() => onVote(battle.battle_id, battle.group_b_id, `${battle.group_b_name} vs ${battle.group_a_name}`)} className="aspect-square">
          <GroupThumb image={battle.group_b_image} name={battle.group_b_name} />
        </button>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900 dark:bg-white border-2 border-white dark:border-neutral-950 flex items-center justify-center text-[10px] font-black text-white dark:text-neutral-900 shadow-lg">
          VS
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold truncate">
          <span className="truncate">{battle.group_a_name}</span>
          <span className="truncate text-right">{battle.group_b_name}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="text-violet-600 dark:text-violet-400">{pctA}%</span>
          <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500" style={{ width: `${pctA}%` }} />
          </div>
          <span className="text-pink-500">{pctB}%</span>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> En curso · {totalVotes.toLocaleString('es-MX')} votos
        </p>
        <p className="flex items-center gap-1 text-[10px] text-neutral-400">
          <Clock className="w-3 h-3" /> Termina en: {timeLeftShort(battle.ends_at)}
        </p>
      </div>
    </div>
  );
}

function UpcomingBattleCard({ battle }: { battle: GroupBattle }) {
  return (
    <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden opacity-90">
      <div className="relative grid grid-cols-2">
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold text-white bg-violet-600 px-2 py-0.5 rounded-full">
          PRÓXIMAMENTE
        </span>
        <div className="aspect-square">
          <GroupThumb image={battle.group_a_image} name={battle.group_a_name} />
        </div>
        <div className="aspect-square">
          <GroupThumb image={battle.group_b_image} name={battle.group_b_name} />
        </div>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900 dark:bg-white border-2 border-white dark:border-neutral-950 flex items-center justify-center text-[10px] font-black text-white dark:text-neutral-900 shadow-lg">
          VS
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold truncate">
          <span className="truncate">{battle.group_a_name}</span>
          <span className="truncate text-right">{battle.group_b_name}</span>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-neutral-500">
          <Hourglass className="w-3 h-3" /> {daysUntil(battle.starts_at)}
        </p>
      </div>
    </div>
  );
}

function FinishedBattleCard({ battle }: { battle: GroupBattle }) {
  const { pctA, pctB } = pct(battle.group_a_points, battle.group_b_points);
  const winnerName = pctA === pctB ? null : pctA > pctB ? battle.group_a_name : battle.group_b_name;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden grayscale-[30%]">
      <div className="relative grid grid-cols-2">
        <div className="aspect-square">
          <GroupThumb image={battle.group_a_image} name={battle.group_a_name} />
        </div>
        <div className="aspect-square">
          <GroupThumb image={battle.group_b_image} name={battle.group_b_name} />
        </div>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900 dark:bg-white border-2 border-white dark:border-neutral-950 flex items-center justify-center text-[10px] font-black text-white dark:text-neutral-900 shadow-lg">
          VS
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className={pctA >= pctB ? 'text-violet-600 dark:text-violet-400' : 'text-neutral-400'}>{pctA}%</span>
          <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-neutral-400 dark:bg-neutral-600" style={{ width: `${pctA}%` }} />
          </div>
          <span className={pctB > pctA ? 'text-pink-500' : 'text-neutral-400'}>{pctB}%</span>
        </div>
        <p className="text-[11px] text-neutral-500 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {winnerName ? `Ganó ${winnerName}` : 'Empate'}
        </p>
      </div>
    </div>
  );
}
