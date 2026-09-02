'use client';

import { Zap } from 'lucide-react';
import { useOnlineCount } from '@/lib/useOnlineCount';

// Línea de cifras bajo los botones del hero — antes el conteo de gente en
// línea vivía aparte en OnlineBar, como su propia píldora debajo del hero;
// ahora comparten esta sola línea con las visitas.
export default function HeroStats({ totalVisits }: { totalVisits: number }) {
  const onlineCount = useOnlineCount();

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500">
      <span className="inline-flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-violet-500" /> Rankings en vivo 24/7
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{onlineCount}</strong> en línea
      </span>
      <span>·</span>
      <span>{totalVisits.toLocaleString('es-MX')} visitas</span>
    </p>
  );
}
