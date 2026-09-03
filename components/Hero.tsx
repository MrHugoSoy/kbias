import { Crown, Heart, Sparkles } from 'lucide-react';
import HeroStats from './HeroStats';
import type { RankingRow } from '@/lib/types';

// Portada nueva estilo "batalla" — usa datos reales (los grupos con más
// puntos este mes) para el collage 2x2 en vez de una imagen decorativa fija,
// así nunca queda desactualizado ni depende de un asset que haya que subir
// a mano.
export default function Hero({ topGroups, totalVisits }: { topGroups: RankingRow[]; totalVisits: number }) {
  return (
    <section className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 items-center py-4">
      <div className="space-y-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 tracking-widest uppercase">
          <Crown className="w-3.5 h-3.5" /> Solo existe un trono
        </p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05]">
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

      {topGroups.length > 0 && (
        <div className="relative">
          <Sparkles className="hidden sm:block absolute -top-6 left-1/2 -translate-x-1/2 w-7 h-7 text-violet-500 fill-violet-500 z-10" />
          <span className="hidden sm:flex absolute top-1/3 -left-5 w-11 h-11 rounded-full bg-white dark:bg-neutral-900 shadow-lg items-center justify-center z-10">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          </span>
          <div className="grid grid-cols-2 gap-4 p-2">
            {topGroups.slice(0, 4).map((g) => (
              // El corte en diagonal es un truco clásico de CSS: se skewea el
              // marco (así el recorte queda en paralelogramo) y la imagen de
              // adentro se skewea al revés y se agranda, para que la foto en
              // sí se vea recta sin distorsión.
              <div
                key={g.group_id}
                className="aspect-[16/9] -skew-x-12 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg"
              >
                {g.image_url && (
                  <div className="w-[150%] h-full -ml-[25%] skew-x-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.image_url} alt={g.group_name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
