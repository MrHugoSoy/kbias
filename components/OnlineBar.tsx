'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OnlineBar({ totalVisits }: { totalVisits: number }) {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    // Reutiliza el cliente compartido de lib/supabase.ts — ver nota en
    // ActivityFeed.tsx sobre por qué crear uno nuevo aquí rompía el login.
    const key = Math.random().toString(36).slice(2);
    const channel = supabase.channel('online-users', {
      config: { presence: { key } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-xs px-4 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{onlineCount}</span>
        <span>en línea</span>
        <span className="text-neutral-400 dark:text-neutral-700">·</span>
        <span>{totalVisits.toLocaleString('es-MX')} visitas desde el lanzamiento</span>
      </div>
    </div>
  );
}
