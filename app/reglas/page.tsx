import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Reglas',
  description: 'Cómo se gana el #1 en K-pop Wars, cómo funciona el voto diario gratuito y moderación.',
};

export default function ReglasPage() {
  return (
    <LegalPage title="Reglas" subtitle="Cómo funciona el juego y qué se permite en K-pop Wars.">
      <LegalSection title="1. Cómo se gana el #1">
        <p>
          El puesto #1 lo tiene el grupo con <strong>más votos del mes calendario en curso</strong> — el ranking se
          reinicia el día 1 de cada mes, sin importar quién iba ganando el mes anterior.
        </p>
        <p>
          El #1 se mantiene hasta que otro grupo acumule más votos ese mismo mes. Los campeones de cada mes quedan
          registrados para siempre en el{' '}
          <Link href="/salon-de-la-fama" className="underline hover:text-pink-400">
            Salón de la Fama
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Esto es un voto, no una apuesta">
        <p>
          Votar en K-pop Wars es completamente gratis. No hay premio en efectivo, sorteo ni retorno económico para
          quien vota — el único "premio" es ver a tu grupo subir en el ranking.
        </p>
      </LegalSection>

      <LegalSection title="3. Cuentas y frecuencia de voto">
        <p>Necesitas una cuenta gratuita (correo y contraseña) para votar.</p>
        <p>Cada cuenta puede votar <strong>una vez cada 24 horas</strong> desde su último voto, por el grupo que elijas.</p>
        <p>No está permitido crear varias cuentas, usar bots o scripts para votar más de lo permitido.</p>
      </LegalSection>

      <LegalSection title="4. Menores de edad">
        <p>Debes tener al menos 18 años, o la mayoría de edad en tu país, para crear una cuenta y votar.</p>
      </LegalSection>

      <LegalSection title="5. Moderación">
        <p>
          Nos reservamos el derecho de eliminar votos que violen estas reglas (múltiples cuentas, bots, explotación
          de errores del sitio), y de suspender el acceso de quien las incumpla de forma repetida.
        </p>
      </LegalSection>

      <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-4">
        ¿Tienes dudas? Revisa el{' '}
        <Link href="/#faq" className="underline hover:text-pink-500 dark:hover:text-pink-400">
          FAQ
        </Link>{' '}
        o escríbenos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}
