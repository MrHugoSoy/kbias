'use client';

import { useEffect, useState } from 'react';
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

export default function DonorSidebar({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

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

          setItems((prev) => [feedItem, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h2 className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Votos en vivo</h2>
      </div>
      <div
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
