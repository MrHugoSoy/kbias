'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Zap, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserAvatar from './UserAvatar';
import LevelBadge from './LevelBadge';

// Colores de pastilla para el nombre del grupo — no hay un color de marca
// guardado por grupo, así que se deriva del nombre (mismo hash simple que
// PixelAvatar) para que cada grupo tenga siempre el mismo color sin
// necesidad de una columna nueva en la base.
const GROUP_PILL_COLORS = [
  'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
];

function groupPillColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GROUP_PILL_COLORS[hash % GROUP_PILL_COLORS.length];
}

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

// "hace Xm/Xh/Xd" — también le da a cada fila algo que ancle el lado
// derecho (antes solo tenía el pill de puntos ahí; sin él, las filas cortas
// se sentían vacías/desbalanceadas en columnas anchas).
function timeAgo(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

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
  const [now, setNow] = useState(() => Date.now());

  const pausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Refresca "hace Xm" cada 30s — no hace falta más seguido para algo que
  // solo cambia en pasos de minutos.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
        <Zap className="w-4 h-4 text-violet-500 fill-violet-500" /> Votos en tiempo real
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 normal-case tracking-normal">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
        </span>
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

      {/* El borde redondeado vive en este wrapper (que no scrollea) y el
          hijo de adentro es el único que scrollea — combinar border-radius
          + overflow-y-auto en el MISMO elemento no recorta el contenido de
          forma consistente en todos los navegadores (esquinas cuadradas al
          hacer scroll). Separar ambas responsabilidades lo vuelve confiable. */}
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl overflow-hidden">
        <div
          ref={containerRef}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onScroll={handleScroll}
          className={
            // La barra queda invisible en reposo y solo aparece al pasar el
            // mouse — sigue siendo scrolleable con la rueda aunque no se vea.
            // Altura fija (no max-h) para quedar pareja con RankingTable en
            // la portada, sin importar cuántos votos haya cargados.
            'divide-y divide-neutral-200 dark:divide-neutral-900 h-[44rem] overflow-y-auto ' +
            '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:theme(colors.violet.400/0.5)_transparent] ' +
            '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
            '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent ' +
            '[&:hover::-webkit-scrollbar-thumb]:bg-violet-400/60'
          }
        >
          {items.length === 0 && (
            <p className="text-center text-neutral-600 py-6 text-sm">Sin actividad todavía — ¡sé el primero!</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="px-4 py-3 text-sm flex items-center gap-3">
              <UserAvatar avatarUrl={item.avatar_url} seed={item.user_id} species={item.avatar_species} size={28} />
              <div className="flex-1 min-w-0">
                <p className="truncate flex items-center gap-1">
                  {item.username ? <strong className="text-violet-600 dark:text-violet-400">@{item.username}</strong> : 'Un fan'}
                  <LevelBadge xp={item.xp} />
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">acaba de votar por</p>
                {item.message && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 italic truncate mt-0.5">"{item.message}"</p>
                )}
              </div>
              <span className={'shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ' + groupPillColor(item.group_name)}>
                {item.group_name} <span className="opacity-70">+{item.points}</span>
              </span>
              <Heart className="w-4 h-4 text-pink-500 fill-current shrink-0" />
              <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-600">{timeAgo(item.created_at, now)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
