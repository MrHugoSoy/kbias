'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Contador global de puntos repartidos en todo el sitio (histórico, no solo
// el mes en curso) — le suma en vivo los puntos de cada voto nuevo, sin
// importar a qué grupo fue. Usado en Estadísticas y el Salón de la Fama.
export function useLiveTotalPoints(initialTotal: number): number {
  const [total, setTotal] = useState(initialTotal);
  const channelId = useRef(`live-total-points-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    setTotal(initialTotal);
  }, [initialTotal]);

  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, (payload) => {
        const row = payload.new as { points: number };
        setTotal((t) => t + row.points);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return total;
}
