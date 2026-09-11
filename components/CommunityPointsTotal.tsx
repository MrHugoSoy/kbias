'use client';

import { Heart } from 'lucide-react';
import { useLiveTotalPoints } from '@/lib/useLiveTotalPoints';

// "Total de votos hoy" — puntos repartidos en TODOS los grupos desde la
// medianoche UTC, no el total del mes (ese ya vive en RankingTable). Usa el
// mismo hook que Estadísticas/Salón de la Fama para sumar en vivo cada voto
// nuevo, solo que sembrado con el total de hoy en vez del histórico.
export default function CommunityPointsTotal({ initialTodayVotes }: { initialTodayVotes: number }) {
  const total = useLiveTotalPoints(initialTodayVotes);

  return (
    <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-4 text-center space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Total de votos hoy</p>
      <p className="flex items-center justify-center gap-1.5 text-3xl font-black text-pink-500 font-mono">
        <Heart className="w-6 h-6 fill-current" />
        {total.toLocaleString('es-MX')}
      </p>
    </div>
  );
}
