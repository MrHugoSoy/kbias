import Link from 'next/link';
import { BID_LIMITS } from '@/lib/bidLimits';
import { POINT_PACKAGES, formatPoints } from '@/lib/pointPackages';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Reglas',
  description: 'Cómo se gana el #1 en K-pop Wars, límites de monto, reembolsos y moderación.',
};

export default function ReglasPage() {
  return (
    <LegalPage title="Reglas" subtitle="Cómo funciona el juego y qué se permite en K-pop Wars.">
      <LegalSection title="1. Cómo se gana el #1">
        <p>
          El puesto #1 lo tiene el grupo cuya comunidad haya impulsado <strong>más en total</strong> — se suman todos
          los impulsos exitosos que ha recibido ese grupo, sin importar cuántos fueron ni de qué tamaño cada uno.
        </p>
        <p>
          No existe un umbral especial para "tomar la delantera": hasta el paquete más chico (ver Sección 3) suma sus
          puntos al total acumulado de tu grupo y puede ayudarlo a subir en el ranking.
        </p>
        <p>El #1 se mantiene hasta que otro grupo acumule más en total. No hay resets ni ciclos.</p>
      </LegalSection>

      <LegalSection title="2. Esto es un impulso digital, no una apuesta">
        <p>
          Impulsar en K-pop Wars es comprar un impulso digital de posición (puntos) para tu grupo favorito — no una
          apuesta. No hay premio en efectivo, sorteo ni retorno económico para quien paga: la contraprestación que
          recibes es el aumento correspondiente de tu grupo en el ranking público, no dinero ni premios.
        </p>
      </LegalSection>

      <LegalSection title="3. Paquetes de puntos y límites">
        <p>Los puntos se compran en paquetes de precio fijo, siempre atados al grupo que elijas al pagar:</p>
        <ul className="list-disc pl-5 space-y-1">
          {POINT_PACKAGES.map((pkg) => (
            <li key={pkg.id}>
              ${(pkg.priceCents / 100).toFixed(2)} — {formatPoints(pkg.points)} puntos
            </li>
          ))}
        </ul>
        <p>Puedes comprar varios paquetes, para el mismo grupo o para grupos distintos, sin límite de cantidad.</p>
        <p>
          Tope acumulado de ${(BID_LIMITS.DAILY_CAP_CENTS / 100).toLocaleString('es-MX')} por día (medido por
          dirección IP), pensado para frenar gasto compulsivo — sobre todo de menores usando la tarjeta de sus
          papás.
        </p>
      </LegalSection>

      <LegalSection title="4. Reembolsos">
        <p>
          Los impulsos no son reembolsables, salvo error técnico comprobado (por ejemplo, un cobro duplicado o una
          falla de nuestro sistema).{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            Escríbenos
          </a>{' '}
          si crees que eso pasó.
        </p>
      </LegalSection>

      <LegalSection title="5. Nombre, red social y anonimato">
        <p>
          Puedes impulsar con tu nombre, de forma anónima, o agregando un link a tu red social para que otros fans
          puedan encontrarte. Si eliges impulsar de forma anónima, tu nombre y tu link no se guardan ni se muestran.
        </p>
        <p>
          No está permitido usar nombres ofensivos, ni un link de red social que suplante la identidad de alguien
          más sin su autorización. Un filtro automático bloquea el contenido más obvio antes de aceptar tu impulso;
          para lo que ese filtro no detecte, seguimos revisando y moderando el feed a mano.
        </p>
      </LegalSection>

      <LegalSection title="6. Menores de edad">
        <p>
          Si eres menor de edad, necesitas la autorización de un adulto responsable del método de pago antes de
          impulsar.
        </p>
      </LegalSection>

      <LegalSection title="7. Moderación">
        <p>
          Nos reservamos el derecho de ocultar o remover impulsos, nombres o links que violen estas reglas, y de
          suspender el acceso de quien las incumpla de forma repetida.
        </p>
      </LegalSection>

      <LegalSection title="8. Donación a fundaciones">
        <p>El 5% de cada impulso exitoso se dona a fundaciones caritativas.</p>
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
