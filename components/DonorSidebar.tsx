'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Heart } from 'lucide-react';

type FeedItem = {
  id: string;
  group_id: string;
  group_name: string;
  fandom_name: string | null;
  created_at: string;
};

export default function DonorSidebar({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('votes-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        async (payload) => {
          const newVote = payload.new as { id: string; group_id: string; created_at: string };

          const { data: group } = await supabase
            .from('groups')
            .select('name, fandom_name')
            .eq('id', newVote.group_id)
            .single();

          const feedItem: FeedItem = {
            id: newVote.id,
            group_id: newVote.group_id,
            group_name: group?.name ?? 'Grupo desconocido',
            fandom_name: group?.fandom_name ?? null,
            created_at: newVote.created_at,
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
      <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-600">Aún no hay votos — ¡sé el primero!</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-lg p-3 text-xs flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0 fill-current" />
            <p className="text-neutral-500">
              Un fan votó por <span className="text-pink-600 dark:text-pink-400">{item.group_name}</span>
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
