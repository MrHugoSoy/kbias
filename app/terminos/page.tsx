import { BID_LIMITS } from '@/lib/stripe';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Términos de servicio',
  description: 'Términos de servicio de K-pop Wars: qué es el sitio, cómo funcionan las pujas y qué aceptas al usarlo.',
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de servicio" subtitle="Última actualización: pendiente de fecha de lanzamiento.">
      <div className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg p-3">
        Esta es una plantilla base para arrancar, no un documento legal revisado por un abogado. Antes de operar con
        dinero real, hazla revisar por alguien con conocimiento legal en tu jurisdicción.
      </div>

      <LegalSection title="1. Qué es K-pop Wars">
        <p>
          K-pop Wars es un ranking público donde cualquier persona puede pagar para que un grupo de K-pop suba en el
          total acumulado de donaciones y, con eso, en el puesto que ocupa. Al usar el sitio o completar un pago,
          aceptas estos Términos y nuestra{' '}
          <a href="/privacidad" className="underline hover:text-pink-500 dark:hover:text-pink-400">
            Política de Privacidad
          </a>
          . Si no estás de acuerdo, no uses el sitio ni hagas pagos.
        </p>
        <p>
          Estos Términos se complementan con las{' '}
          <a href="/reglas" className="underline hover:text-pink-500 dark:hover:text-pink-400">
            Reglas
          </a>
          . Si hay una contradicción entre ambos, estos Términos tienen prioridad.
        </p>
      </LegalSection>

      <LegalSection title="2. No es una apuesta ni una inversión">
        <p>
          Pagar en K-pop Wars es un apoyo/tip voluntario a un grupo. No compras un premio, un sorteo, una acción, ni
          ningún retorno económico. Tampoco compras exclusividad, un puesto garantizado por tiempo fijo, ni ningún
          resultado específico — otra persona puede donar más después y tu grupo puede bajar de puesto.
        </p>
      </LegalSection>

      <LegalSection title="3. Elegibilidad">
        <p>Para pujar necesitas poder formar un contrato válido en tu país. Si eres menor de edad, necesitas la autorización de un adulto responsable del método de pago que uses.</p>
        <p>No puedes usar el sitio si las leyes de tu país o las sanciones comerciales aplicables te lo prohíben.</p>
      </LegalSection>

      <LegalSection title="4. Pagos">
        <p>
          Los pagos se procesan a través de Stripe. Nosotros nunca recibimos ni guardamos el número completo de tu
          tarjeta — eso lo maneja Stripe directamente. Los términos y política de privacidad de Stripe también
          aplican al pago en sí.
        </p>
        <p>
          Monto mínimo por puja: ${(BID_LIMITS.MIN_CENTS / 100).toFixed(2)}. Monto máximo por transacción individual:
          ${(BID_LIMITS.MAX_PER_TX_CENTS / 100).toLocaleString('es-MX')}. El monto de tu puja se suma al total
          acumulado de tu grupo en cuanto el pago se confirma.
        </p>
      </LegalSection>

      <LegalSection title="5. Reembolsos">
        <p>
          Todos los pagos son finales. Una vez que el pago se confirma y la puja queda registrada en el ranking
          público, el servicio ya se prestó. No hacemos reembolsos por cambios de opinión, porque tu grupo bajó de
          puesto después, ni porque otro grupo acumuló más. Sí evaluamos reembolsos por errores técnicos
          comprobados de nuestro lado (por ejemplo, un cobro duplicado).
        </p>
      </LegalSection>

      <LegalSection title="6. Contenido y conducta">
        <p>
          No está permitido usar nombres ofensivos, ilegales, o que suplanten la identidad de un tercero sin su
          autorización, ni un link de red social que apunte a contenido ilegal. Nos reservamos el derecho de ocultar
          o eliminar cualquier puja, nombre o link que viole esto, y de suspender el acceso de quien lo haga de
          forma repetida.
        </p>
      </LegalSection>

      <LegalSection title={'7. El servicio se ofrece "tal cual"'}>
        <p>
          K-pop Wars se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o
          implícitas. No garantizamos que el sitio esté libre de errores, interrupciones, o que un puesto específico
          se mantenga por un tiempo determinado.
        </p>
      </LegalSection>

      <LegalSection title="8. Límite de responsabilidad">
        <p>
          En la máxima medida que permita la ley aplicable, no seremos responsables por daños indirectos,
          incidentales o consecuentes derivados del uso del sitio. Nuestra responsabilidad total frente a ti, si
          llegara a existir, no superará el monto que hayas pagado en los últimos 3 meses.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos en cualquier momento. Si el cambio es importante, lo anunciaremos en el
          sitio. Seguir usando K-pop Wars después de un cambio significa que lo aceptas.
        </p>
      </LegalSection>

      <LegalSection title="10. Ley aplicable, sin importar tu país">
        <p>
          K-pop Wars recibe pujas de fans en distintos países, así que estos Términos no están atados a la ley de un
          solo lugar. Si tu país o región te da derechos que no se pueden renunciar por contrato (por ejemplo,
          protecciones al consumidor en tu jurisdicción local), esos derechos siguen aplicando sin importar lo que
          digan estos Términos.
        </p>
        <p>
          Para todo lo demás, preferimos resolver cualquier problema escribiéndonos directamente antes de recurrir a
          la vía legal — dado el tamaño del servicio, casi siempre es más rápido así.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          ¿Dudas sobre estos Términos? Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
