'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { VenetianMask } from 'lucide-react';

type FeedItem = {
  id: string;
  group_name: string;
  fandom_name: string | null;
  amount_cents: number;
  points: number;
  supporter_name: string | null;
  is_anonymous: boolean;
  social_url: string | null;
  message: string | null;
  created_at: string;
};

export default function DonorSidebar({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Mismo patrón que ActivityFeed: el payload de Realtime no trae el
    // join con groups, así que se hace un fetch puntual del grupo.
    const channel = supabase
      .channel('donor-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: 'status=eq.succeeded' },
        async (payload) => {
          const newBid = payload.new as {
            id: string;
            group_id: string;
            amount_cents: number;
            points: number;
            supporter_name: string | null;
            is_anonymous: boolean;
            social_url: string | null;
            message: string | null;
            created_at: string;
          };

          const { data: group } = await supabase
            .from('groups')
            .select('name, fandom_name')
            .eq('id', newBid.group_id)
            .single();

          const feedItem: FeedItem = {
            id: newBid.id,
            group_name: group?.name ?? 'Grupo desconocido',
            fandom_name: group?.fandom_name ?? null,
            amount_cents: newBid.amount_cents,
            points: newBid.points,
            supporter_name: newBid.supporter_name,
            is_anonymous: newBid.is_anonymous,
            social_url: newBid.social_url,
            message: newBid.message,
            created_at: newBid.created_at,
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
        <h2 className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Impulsores en vivo</h2>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-600">Aún no hay impulsos — ¡sé el primero!</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {item.is_anonymous ? (
                  <span className="inline-flex items-center gap-1">
                    <VenetianMask className="w-3.5 h-3.5" /> Anónimo
                  </span>
                ) : item.social_url ? (
                  <a
                    href={item.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-pink-400"
                  >
                    {item.supporter_name || 'un fan'}
                  </a>
                ) : (
                  item.supporter_name || 'un fan'
                )}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono shrink-0">+{item.points.toLocaleString('es-MX')} pts</span>
            </div>
            <p className="text-neutral-500">
              impulsó a <span className="text-pink-600 dark:text-pink-400">{item.group_name}</span>
            </p>
            {item.message && <p className="text-neutral-500 dark:text-neutral-400 italic break-words">"{item.message}"</p>}
          </div>
        ))}
      </div>
    </aside>
  );
}
