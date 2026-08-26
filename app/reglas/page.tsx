import Link from 'next/link';
import { BID_LIMITS } from '@/lib/stripe';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata = {
  title: 'Reglas — El Trono',
};

export default function ReglasPage() {
  return (
    <LegalPage title="Reglas" subtitle="Cómo funciona el juego y qué se permite en El Trono.">
      <LegalSection title="1. Cómo se gana el #1">
        <p>
          El puesto #1 lo tiene el grupo cuya comunidad haya donado <strong>más en total</strong> — se suman todas
          las pujas exitosas que ha recibido ese grupo, sin importar cuántas fueron ni de qué tamaño cada una.
        </p>
        <p>
          No existe un monto mínimo para "tomar la delantera": cualquier puja, por chica que sea, se suma al total
          acumulado de tu grupo y puede ayudarlo a subir en el ranking.
        </p>
        <p>El #1 se mantiene hasta que otro grupo acumule más en total. No hay resets ni ciclos.</p>
      </LegalSection>

      <LegalSection title="2. Esto es un apoyo, no una apuesta">
        <p>
          Pujar en El Trono es un apoyo/tip a tu grupo favorito. No hay premio, sorteo ni retorno económico para
          quien paga — el único "premio" es ver a tu grupo en el #1.
        </p>
      </LegalSection>

      <LegalSection title="3. Montos y límites">
        <p>Monto mínimo por puja: ${(BID_LIMITS.MIN_CENTS / 100).toFixed(2)}.</p>
        <p>
          Monto máximo por transacción individual: ${(BID_LIMITS.MAX_PER_TX_CENTS / 100).toLocaleString('es-MX')}.
          Puedes hacer varias pujas si quieres superar ese límite.
        </p>
        <p>
          Tope acumulado de ${(BID_LIMITS.DAILY_CAP_CENTS / 100).toLocaleString('es-MX')} por día (medido por
          dirección IP), pensado para frenar gasto compulsivo — sobre todo de menores usando la tarjeta de sus
          papás.
        </p>
      </LegalSection>

      <LegalSection title="4. Reembolsos">
        <p>
          Las pujas no son reembolsables, salvo error técnico comprobado (por ejemplo, un cobro duplicado o una
          falla de nuestro sistema). Escríbenos si crees que eso pasó.
        </p>
      </LegalSection>

      <LegalSection title="5. Nombre, red social y anonimato">
        <p>
          Puedes pujar con tu nombre, de forma anónima, o agregando un link a tu red social para que otros fans
          puedan encontrarte. Si eliges pujar de forma anónima, tu nombre y tu link no se guardan ni se muestran.
        </p>
        <p>
          No está permitido usar nombres ofensivos, ni un link de red social que suplante la identidad de alguien
          más sin su autorización. Un filtro automático bloquea el contenido más obvio antes de aceptar tu puja;
          para lo que ese filtro no detecte, seguimos revisando y moderando el feed a mano.
        </p>
      </LegalSection>

      <LegalSection title="6. Menores de edad">
        <p>
          Si eres menor de edad, necesitas la autorización de un adulto responsable del método de pago antes de
          pujar.
        </p>
      </LegalSection>

      <LegalSection title="7. Moderación">
        <p>
          Nos reservamos el derecho de ocultar o remover pujas, nombres o links que violen estas reglas, y de
          suspender el acceso de quien las incumpla de forma repetida.
        </p>
      </LegalSection>

      <LegalSection title="8. Donación a fundaciones">
        <p>El 5% de cada puja exitosa se dona a fundaciones caritativas.</p>
      </LegalSection>

      <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-4">
        ¿Tienes dudas? Revisa el{' '}
        <Link href="/#faq" className="underline hover:text-pink-500 dark:hover:text-pink-400">
          FAQ
        </Link>{' '}
        o contáctanos directamente.
      </p>
    </LegalPage>
  );
}
