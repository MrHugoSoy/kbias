import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Puesto de ayer (congelado por sync_rank_snapshots, ver schema.sql) contra
// el puesto en vivo de ahora mismo — no es un historial completo, solo "¿ya
// subiste o bajaste desde que empezó el día?". Compartido entre el podio de
// la portada y el ranking completo de /estadisticas.
export default function RankChange({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null || previous === current) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-600">
        <Minus className="w-3 h-3" /> Igual
      </span>
    );
  }
  const delta = previous - current;
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-green-600 dark:text-green-400 font-semibold">
        <TrendingUp className="w-3 h-3" /> {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-red-500 font-semibold">
      <TrendingDown className="w-3 h-3" /> {Math.abs(delta)}
    </span>
  );
}
