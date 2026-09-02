'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Cuántas pestañas tienen la portada abierta ahora mismo, vía presence de
// Realtime. Un solo hook para que solo haya UN canal/track activo por
// pestaña — montarlo en dos componentes a la vez inflaría el conteo,
// porque cada uno se registraría como una persona en línea aparte.
export function useOnlineCount(): number {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
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

  return onlineCount;
}
