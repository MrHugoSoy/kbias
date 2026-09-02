'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import UserAvatar from './UserAvatar';

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
  message: string | null;
  points: number;
};

export default function ActivityFeed({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    // Escucha nuevos votos en tiempo real y los mete arriba del feed.
    // Reutiliza el cliente compartido de lib/supabase.ts — crear una
    // instancia nueva aquí (como antes) generaba múltiples GoTrueClient
    // sobre el mismo storage key, lo que Supabase documenta como causa de
    // comportamiento indefinido en el manejo de la sesión (login que deja
    // de funcionar de forma intermitente hasta volver a iniciar sesión).
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
            supabase.from('profiles').select('username, avatar_species, avatar_url').eq('id', newVote.user_id).maybeSingle(),
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
            message: newVote.message ?? null,
            points: newVote.points,
          };

          setItems((prev) => [feedItem, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `Hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h`;
  }

  return (
    <section id="historial" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-bold">ACTIVIDAD EN VIVO</h2>
          <span className="text-[10px] bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">EN VIVO</span>
        </div>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-transparent rounded-xl overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3 text-sm flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-16 shrink-0" suppressHydrationWarning>{timeAgo(item.created_at)}</span>
            <UserAvatar avatarUrl={item.avatar_url} seed={item.user_id} species={item.avatar_species} size={24} />
            <span className="flex-1 min-w-0">
              <span className="block">
                {item.username ? <strong>@{item.username}</strong> : 'Un fan'} le dio{' '}
                <strong className="text-amber-500">
                  {item.points} {item.points === 1 ? 'punto' : 'puntos'}
                </strong>{' '}
                a <strong className="text-pink-600 dark:text-pink-400">{item.group_name}</strong>
              </span>
              {item.message && (
                <span className="block text-xs text-neutral-500 dark:text-neutral-400 italic truncate">
                  "{item.message}"
                </span>
              )}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-neutral-600 py-6 text-sm">Sin actividad todavía — ¡sé el primero!</p>
        )}
      </div>
    </section>
  );
}
