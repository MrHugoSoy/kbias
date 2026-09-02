'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserAvatar from './UserAvatar';
import { levelForXp, xpForLevel } from '@/lib/level';

type Stats = {
  username: string | null;
  avatarSpecies: string | null;
  avatarUrl: string | null;
  xp: number;
  currentStreak: number;
  totalPointsGiven: number;
  totalVotesCast: number;
};

// Tarjeta "tu progreso" de la portada — datos reales de la cuenta con
// sesión iniciada (nivel/XP/racha ya existían en /perfil; aquí se
// reutiliza la misma fórmula de nivel). Sin sesión solo se ve la
// invitación a votar, sin inventar cifras de una cuenta que no existe.
export default function VoteCtaWidget() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      return;
    }
    Promise.all([
      supabase.from('profiles').select('username, avatar_species, avatar_url, xp, current_streak').eq('id', userId).maybeSingle(),
      supabase.from('votes').select('points').eq('user_id', userId),
    ]).then(([{ data: profile }, { data: votes }]) => {
      setStats({
        username: profile?.username ?? null,
        avatarSpecies: profile?.avatar_species ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        xp: profile?.xp ?? 0,
        currentStreak: profile?.current_streak ?? 0,
        totalPointsGiven: (votes ?? []).reduce((sum, v) => sum + v.points, 0),
        totalVotesCast: (votes ?? []).length,
      });
    });
  }, [userId]);

  const level = stats ? levelForXp(stats.xp) : 1;
  const xpIntoLevel = stats ? stats.xp - xpForLevel(level) : 0;
  const xpForNextLevel = stats ? xpForLevel(level + 1) - xpForLevel(level) : 1;
  const progressPct = stats ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 text-white p-6 space-y-3">
        <Trophy className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10" />
        <h3 className="text-lg font-black relative">¡Tu voto hace la diferencia!</h3>
        <p className="text-sm text-white/90 relative max-w-xs">
          Cada voto suma. Cada fan cuenta. Apoya a tu grupo favorito y llévalo a la cima.
        </p>
        <a
          href="/#ranking"
          className="relative inline-block bg-white text-violet-700 font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Votar ahora
        </a>
      </div>

      {userId && stats && (
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar avatarUrl={stats.avatarUrl} seed={userId} species={stats.avatarSpecies} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{stats.username ? `@${stats.username}` : 'Tu cuenta'}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">Nivel {level}</p>
            </div>
            <p className="text-xs text-neutral-500 shrink-0 font-mono">
              {xpIntoLevel}/{xpForNextLevel} XP
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div>
              <p className="font-black text-amber-500">{stats.totalPointsGiven}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Puntos</p>
            </div>
            <div>
              <p className="font-black text-violet-600 dark:text-violet-400">{stats.totalVotesCast}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Votos</p>
            </div>
            <div>
              <p className="font-black text-pink-500">{stats.currentStreak}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Racha</p>
            </div>
          </div>
          <Link href="/perfil" className="block text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Ver mi perfil
          </Link>
        </div>
      )}
    </div>
  );
}
