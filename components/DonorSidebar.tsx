'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserAvatar from './UserAvatar';
import LevelBadge from './LevelBadge';

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

// Cuánto se espera sin interacción antes de retomar el auto-scroll solo.
const RESUME_AFTER_MS = 5000;

export default function DonorSidebar({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [pending, setPending] = useState<FeedItem[]>([]);
  const [paused, setPaused] = useState(false);

  // El handler de Realtime se registra una sola vez (deps [] en el useEffect
  // de abajo) — usa este ref en vez del state "paused" para no quedarse con
  // un valor stale por el cierre de la función.
  const pausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  function clearResumeTimer() {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }

  function resume() {
    clearResumeTimer();
    setPaused(false);
    setPending((pend) => {
      if (pend.length > 0) {
        setItems((prev) => [...pend, ...prev].slice(0, 20));
      }
      return [];
    });
    // Vuelve a dejar visible lo más nuevo, arriba del todo.
    ignoreScrollRef.current = true;
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      ignoreScrollRef.current = false;
    }, 500);
  }

  function pause() {
    setPaused(true);
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(resume, RESUME_AFTER_MS);
  }

  function handleScroll() {
    if (ignoreScrollRef.current) return;
    if (!pausedRef.current) {
      if ((containerRef.current?.scrollTop ?? 0) > 4) pause();
      return;
    }
    // Sigue interactuando mientras está en pausa: reinicia el contador de
    // inactividad en vez de retomar de inmediato.
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(resume, RESUME_AFTER_MS);
  }

  useEffect(() => {
    // Reutiliza el cliente compartido de lib/supabase.ts — ver nota en
    // ActivityFeed.tsx sobre por qué crear uno nuevo aquí rompía el login.
    const channel = supabase
      .channel('votes-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        async (payload) => {
          const newVote = payload.new as {
            id: string;
            group_id: string;
            created_at: string;
            user_id: string;
            message: string | null;
            points: number;
          };

          const [{ data: group }, { data: profile }] = await Promise.all([
            supabase.from('groups').select('name, fandom_name').eq('id', newVote.group_id).single(),
            supabase.from('profiles').select('username, avatar_species, avatar_url, xp').eq('id', newVote.user_id).maybeSingle(),
          ]);

          const feedItem: FeedItem = {
            id: newVote.id,
            group_id: newVote.group_id,
            group_name: group?.name ?? 'Grupo desconocido',
            fandom_name: group?.fandom_name ?? null,
            created_at: newVote.created_at,
            user_id: newVote.user_id,
            username: profile?.username ?? null,
            avatar_species: profile?.avatar_species ?? null,
            avatar_url: profile?.avatar_url ?? null,
            xp: profile?.xp ?? 0,
            message: newVote.message ?? null,
            points: newVote.points,
          };

          // Congelado (el usuario está viendo votos anteriores): se acumula
          // aparte y se muestra un badge, en vez de mover la lista debajo de
          // donde está leyendo.
          if (pausedRef.current) {
            setPending((prev) => [feedItem, ...prev].slice(0, 20));
            return;
          }

          setItems((prev) => [feedItem, ...prev].slice(0, 20));
          ignoreScrollRef.current = true;
          requestAnimationFrame(() => {
            if (containerRef.current) containerRef.current.scrollTop = 0;
            setTimeout(() => {
              ignoreScrollRef.current = false;
            }, 50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearResumeTimer();
    };
  }, []);

  return (
    <aside className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h2 className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Votos en vivo</h2>
      </div>

      {paused && pending.length > 0 && (
        <button
          onClick={resume}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-950/60 border border-pink-200 dark:border-pink-900 rounded-full py-1.5 transition"
        >
          <ArrowUp className="w-3 h-3" />
          {pending.length} {pending.length === 1 ? 'nuevo voto' : 'nuevos votos'}
        </button>
      )}

      <div
        ref={containerRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onScroll={handleScroll}
        className={
          'space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 ' +
          '[scrollbar-width:thin] [scrollbar-color:theme(colors.pink.400/0.5)_transparent] ' +
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-pink-400/50 ' +
          'hover:[&::-webkit-scrollbar-thumb]:bg-pink-400/80'
        }
      >
        {items.length === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-600">Aún no hay votos — ¡sé el primero!</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-lg p-3 text-xs flex items-center gap-2">
            <UserAvatar avatarUrl={item.avatar_url} seed={item.user_id} species={item.avatar_species} size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-neutral-500 truncate flex items-center gap-1">
                {item.username ? <strong className="text-neutral-700 dark:text-neutral-300 truncate">@{item.username}</strong> : 'Un fan'}
                <LevelBadge xp={item.xp} />
                <span className="truncate">
                  le dio <strong className="text-amber-500">{item.points}</strong> a{' '}
                  <span className="text-pink-600 dark:text-pink-400">{item.group_name}</span>
                </span>
              </p>
              {item.message && (
                <p className="text-neutral-500 dark:text-neutral-500 italic truncate">"{item.message}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
