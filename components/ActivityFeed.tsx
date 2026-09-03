'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Zap } from 'lucide-react';
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

// Colores del pill "+N pts" — rotan por fila (no por cantidad) solo para
// darle variedad visual al feed, como en el mockup.
const PILL_COLORS = [
  'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40',
  'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40',
  'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
  'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40',
];

// "Actividad en vivo" — antes vivía duplicado entre este componente (fila
// completa, solo visible en móvil) y DonorSidebar (versión compacta para el
// sidebar de escritorio). El nuevo diseño solo tiene un panel de actividad
// visible en todos los tamaños, así que se fusionaron aquí: el estilo de
// fila viene de este archivo, y el auto-scroll con pausa al interactuar +
// la barra de scroll invisible-hasta-hover vienen de DonorSidebar.
export default function ActivityFeed({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [pending, setPending] = useState<FeedItem[]>([]);
  const [paused, setPaused] = useState(false);

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
        setItems((prev) => [...pend, ...prev].slice(0, 30));
      }
      return [];
    });
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
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(resume, RESUME_AFTER_MS);
  }

  useEffect(() => {
    // Reutiliza el cliente compartido de lib/supabase.ts — crear una
    // instancia nueva aquí generaba múltiples GoTrueClient sobre el mismo
    // storage key, lo que Supabase documenta como causa de comportamiento
    // indefinido en el manejo de la sesión.
    const channel = supabase
      .channel('votes-feed')
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

          if (pausedRef.current) {
            setPending((prev) => [feedItem, ...prev].slice(0, 30));
            return;
          }

          setItems((prev) => [feedItem, ...prev].slice(0, 30));
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
    <section className="space-y-3">
      <h2 className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-violet-500 fill-violet-500" /> Actividad en vivo
      </h2>

      {paused && pending.length > 0 && (
        <button
          onClick={resume}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 border border-violet-200 dark:border-violet-900 rounded-full py-1.5 transition"
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
          // La barra queda invisible en reposo y solo aparece al pasar el
          // mouse — sigue siendo scrolleable con la rueda aunque no se vea.
          'divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-transparent rounded-xl overflow-hidden max-h-[28rem] overflow-y-auto ' +
          '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:theme(colors.violet.400/0.5)_transparent] ' +
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent ' +
          '[&:hover::-webkit-scrollbar-thumb]:bg-violet-400/60'
        }
      >
        {items.length === 0 && (
          <p className="text-center text-neutral-600 py-6 text-sm">Sin actividad todavía — ¡sé el primero!</p>
        )}
        {items.map((item, i) => (
          <div key={item.id} className="px-4 py-3 text-sm flex items-center gap-3">
            <UserAvatar avatarUrl={item.avatar_url} seed={item.user_id} species={item.avatar_species} size={28} />
            <div className="flex-1 min-w-0">
              <p className="truncate flex items-center gap-1 flex-wrap">
                {item.username ? <strong className="text-violet-600 dark:text-violet-400">@{item.username}</strong> : 'Un fan'}
                <LevelBadge xp={item.xp} />
                <Zap className="w-3 h-3 text-violet-400 shrink-0" />
                <span className="text-neutral-600 dark:text-neutral-400 truncate">
                  dio {item.points} {item.points === 1 ? 'punto' : 'puntos'} a{' '}
                  <strong className="uppercase text-neutral-900 dark:text-white">{item.group_name}</strong>
                </span>
              </p>
              {item.message && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic truncate mt-0.5">"{item.message}"</p>
              )}
            </div>
            <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${PILL_COLORS[i % PILL_COLORS.length]}`}>
              +{item.points} pts
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
