'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type FeedItem = {
  id: string;
  group_name: string;
  fandom_name: string | null;
  amount_cents: number;
  supporter_name: string | null;
  is_anonymous: boolean;
  social_url: string | null;
  created_at: string;
};

export default function ActivityFeed({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Escucha nuevas pujas exitosas en tiempo real y las mete arriba del feed.
    // Esto es lo que le da la sensación "viva" al sitio, igual que el
    // "latest activity" de outbid.lol.
    const channel = supabase
      .channel('bids-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: 'status=eq.succeeded' },
        async (payload) => {
          // El payload de Realtime trae la fila cruda de `bids`, sin el join
          // a `groups` (eso solo lo da la vista `activity_feed`). Hacemos un
          // fetch puntual del grupo para no perder group_name/fandom_name.
          const newBid = payload.new as {
            id: string;
            group_id: string;
            amount_cents: number;
            supporter_name: string | null;
            is_anonymous: boolean;
            social_url: string | null;
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
            supporter_name: newBid.supporter_name,
            is_anonymous: newBid.is_anonymous,
            social_url: newBid.social_url,
            created_at: newBid.created_at,
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
          <span className="text-[10px] bg-pink-950 text-pink-400 px-2 py-0.5 rounded-full">EN VIVO</span>
        </div>
        <span className="text-xs text-pink-400">VER TODO ›</span>
      </div>
      <div className="divide-y divide-neutral-900 bg-neutral-950 rounded-xl overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="text-xs text-neutral-500 w-16 shrink-0">{timeAgo(item.created_at)}</span>
            <span>{item.is_anonymous ? '🎭' : '👤'}</span>
            <span className="flex-1">
              {!item.is_anonymous && item.social_url ? (
                <a
                  href={item.social_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-pink-400"
                >
                  {item.supporter_name || 'un fan'}
                </a>
              ) : item.is_anonymous ? (
                'un fan anónimo'
              ) : (
                item.supporter_name || 'un fan'
              )}{' '}
              apoyó a <strong className="text-pink-400">{item.group_name}</strong>
            </span>
            <span className="font-mono text-amber-400">${(item.amount_cents / 100).toFixed(2)}</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-neutral-600 py-6 text-sm">Sin actividad todavía — ¡sé el primero!</p>
        )}
      </div>
    </section>
  );
}
