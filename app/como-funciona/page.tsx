import Link from 'next/link';
import { Swords, CheckSquare, TrendingUp, Award, HelpCircle } from 'lucide-react';
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

      <section id="faq" className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-violet-500" /> FAQ
        </h2>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl overflow-hidden">
          <div className="p-4 space-y-1">
            <p className="font-semibold text-sm">¿Cuesta dinero votar?</p>
            <p className="text-sm text-neutral-500">No, votar es completamente gratis. Solo necesitas una cuenta para evitar que alguien vote varias veces.</p>
          </div>
          <div className="p-4 space-y-1">
            <p className="font-semibold text-sm">¿Por qué necesito una cuenta?</p>
            <p className="text-sm text-neutral-500">Para que el ranking refleje personas reales — sin cuenta, cualquiera podría votar cientos de veces por su grupo.</p>
          </div>
          <div className="p-4 space-y-1">
            <p className="font-semibold text-sm">¿Cuántos puntos tengo?</p>
            <p className="text-sm text-neutral-500">5 puntos por cuenta cada día calendario (UTC) — puedes dárselos todos a un grupo o repartirlos entre varios.</p>
          </div>
          <div className="p-4 space-y-1">
            <p className="font-semibold text-sm">¿Cómo se decide quién tiene el #1?</p>
            <p className="text-sm text-neutral-500">
              Gana el grupo con más puntos acumulados en el mes calendario en curso. El ranking se reinicia el día 1
              de cada mes — los campeones de meses anteriores quedan en el{' '}
              <Link href="/salon-de-la-fama" className="underline hover:text-violet-500 dark:hover:text-violet-400">
                Salón de la Fama
              </Link>
              .
            </p>
          </div>
          <div className="p-4 space-y-1">
            <p className="font-semibold text-sm">Represento a un grupo, ¿puedo reclamar su perfil?</p>
            <p className="text-sm text-neutral-500">
              Sí —{' '}
              <a href="/reclamar" className="underline hover:text-violet-500 dark:hover:text-violet-400">
                envía tu solicitud aquí
              </a>
              . La revisamos a mano contra el link de verificación que dejes.
            </p>
          </div>
        </div>
      </section>
    </LegalPage>
  );
}
