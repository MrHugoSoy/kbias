import { Swords, CheckSquare, TrendingUp, Award } from 'lucide-react';
import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Cómo funciona',
  description: 'Cómo votar gratis en K-pop Wars: crea tu cuenta, elige tu grupo, reparte tus puntos y súbelo al ranking.',
};

const STEPS = [
  { Icon: Swords, title: 'Crea tu cuenta gratis', body: 'Solo necesitas un correo y una contraseña — sin costo, sin tarjeta.' },
  { Icon: CheckSquare, title: 'Elige tu grupo', body: 'Escoge uno o varios grupos de la lista de competidores.' },
  { Icon: TrendingUp, title: 'Reparte tus puntos — es gratis', body: '5 puntos por cuenta cada día. Dáselos todos a uno o repártelos entre varios.' },
  { Icon: Award, title: 'Tu grupo sube en el ranking', body: 'El total se actualiza al instante. El #1 se mantiene hasta que otro grupo acumule más puntos ese mes.' },
];

export default function ComoFuncionaPage() {
  return (
    <LegalPage title="¿Cómo funciona?" subtitle="Votar en K-pop Wars toma menos de un minuto." wide>
      <div className="grid sm:grid-cols-2 gap-4">
        {STEPS.map(({ Icon, title, body }, i) => (
          <div key={i} className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-950/50 dark:to-pink-950/50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs font-mono text-violet-500">{String(i + 1).padStart(2, '0')}</p>
            </div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-neutral-500">{body}</p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
