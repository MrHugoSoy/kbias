import { Crown } from 'lucide-react';
import HeroStats from './HeroStats';
import type { RankingRow } from '@/lib/types';

// Portada nueva estilo "batalla" — usa datos reales (los dos grupos con más
// puntos este mes) para el visual "VS" en vez de una imagen decorativa fija,
// así nunca queda desactualizado ni depende de un asset que haya que subir
// a mano.
export default function Hero({ topGroups, totalVisits }: { topGroups: RankingRow[]; totalVisits: number }) {
  const [first, second] = topGroups;

  return (
    <section className="grid md:grid-cols-2 gap-10 items-center py-4">
      <div className="space-y-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 tracking-widest uppercase">
          <Crown className="w-3.5 h-3.5" /> Solo existe un trono
        </p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
          LA BATALLA
          <br />
          DEL{' '}
          <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">K-POP</span>
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm">Vota por tu grupo favorito y llévalo a la cima.</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/#ranking"
            className="bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold px-6 py-3 rounded-lg transition"
          >
            Votar ahora
          </a>
          <a
            href="/#ranking"
            className="border border-neutral-300 dark:border-neutral-700 hover:border-violet-400 dark:hover:border-violet-500 font-bold px-6 py-3 rounded-lg transition"
          >
            Ver rankings
          </a>
        </div>
        <HeroStats totalVisits={totalVisits} />
      </div>

      {first && second && (
        <div className="relative">
          <div className="grid grid-cols-2 gap-3">
            {[first, second].map((g) => (
              <div
                key={g.group_id}
                className="aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                {g.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image_url} alt={g.group_name} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-white dark:bg-neutral-950 border-2 border-violet-500 shadow-lg flex items-center justify-center font-black text-violet-600 dark:text-violet-400">
              VS
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
