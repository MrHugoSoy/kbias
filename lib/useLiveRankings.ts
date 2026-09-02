'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Le suma en vivo los puntos de cada voto nuevo al total del grupo que le
// corresponde y reordena — usado por cualquier pantalla que muestre el
// ranking del mes en curso (portada, página de grupo, estadísticas) para
// que un puesto pueda cambiar sin recargar. Como group_rankings ya filtra
// por el mes calendario (UTC) actual, cualquier voto que llegue por
// Realtime "ahora" siempre cae dentro de ese mes.
export function useLiveRankings<T extends { group_id: string; total_points: number }>(initialRankings: T[]): T[] {
  const [rankings, setRankings] = useState(initialRankings);
  const channelId = useRef(`live-rankings-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    setRankings(initialRankings);
  }, [initialRankings]);

  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          const row = payload.new as { group_id: string; points: number };
          setRankings((prev) => {
            if (!prev.some((r) => r.group_id === row.group_id)) return prev;
            return prev
              .map((r) => (r.group_id === row.group_id ? { ...r, total_points: r.total_points + row.points } : r))
              .sort((a, b) => b.total_points - a.total_points);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return rankings;
}
