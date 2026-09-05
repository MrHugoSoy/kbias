'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, User as UserIcon, Trophy, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { levelForXp, xpForLevel } from '@/lib/level';
import UserAvatar from './UserAvatar';
import AuthModal from './AuthModal';

type Me = {
  id: string;
  createdAt: string;
  username: string | null;
  avatarUrl: string | null;
  avatarSpecies: string | null;
  xp: number;
  postCount: number;
};

const NAV_ITEMS = [
  { href: '/comunidad', label: 'Inicio de la comunidad', Icon: Home },
  { href: '/perfil', label: 'Mi perfil', Icon: UserIcon },
  { href: '/estadisticas', label: 'Ranking Global', Icon: Trophy },
  { href: '/perfil', label: 'Ajustes', Icon: Settings },
];

export default function CommunitySidebar() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMe(userId: string | undefined, createdAt: string | undefined) {
      if (!userId || !createdAt) {
        if (!cancelled) setMe(null);
        return;
      }
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url, avatar_species, xp').eq('id', userId).maybeSingle(),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      if (cancelled) return;
      setMe({
        id: userId,
        createdAt,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        avatarSpecies: profile?.avatar_species ?? null,
        xp: profile?.xp ?? 0,
        postCount: count ?? 0,
      });
    }

    supabase.auth.getSession().then(({ data }) => loadMe(data.session?.user?.id, data.session?.user?.created_at));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => loadMe(session?.user?.id, session?.user?.created_at));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const level = me ? levelForXp(me.xp) : 1;
  const xpIntoLevel = me ? me.xp - xpForLevel(level) : 0;
  const xpForNextLevel = xpForLevel(level + 1) - xpForLevel(level);
  const levelProgressPct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));
  const memberSinceYear = me ? new Date(me.createdAt).getFullYear() : null;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-4 space-y-3">
        {me === undefined ? (
          <div className="h-24 animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
        ) : me === null ? (
          <div className="text-center space-y-2 py-2">
            <p className="text-sm text-neutral-500">Inicia sesión para publicar y seguir tu actividad.</p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-lg transition"
            >
              Únete a la comunidad
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={me.avatarUrl} seed={me.id} species={me.avatarSpecies} size={48} />
              <div className="min-w-0">
                <p className="font-bold truncate">{me.username ? `@${me.username}` : 'Elige un nombre de usuario'}</p>
                {memberSinceYear && <p className="text-xs text-neutral-500">Desde {memberSinceYear}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 text-center">
                <p className="text-sm font-black">{me.postCount.toLocaleString('es-MX')}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Publicaciones</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400">Nivel {level}</p>
                <p className="text-[10px] text-neutral-500">
                  {me.xp} / {xpForNextLevel} XP
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <nav className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-2 space-y-0.5 text-sm">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
    </div>
  );
}
