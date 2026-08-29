import { BID_LIMITS } from '@/lib/bidLimits';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Términos de servicio',
  description: 'Términos de servicio de K-pop Wars: qué es el sitio, cómo funcionan las pujas y qué aceptas al usarlo.',
};

const LEGAL_ENTITY_TYPE = 'un operador individual con actividad empresarial en México';
const GOVERNING_LAW = 'México';
const CHANGE_NOTICE_DAYS = 15;
const LAST_UPDATED = '29 de agosto de 2026';

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de servicio" subtitle={`Última actualización: ${LAST_UPDATED}.`}>
      <div className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg p-3">
        Este documento es más completo que una plantilla básica, pero sigue sin ser una revisión de un abogado.
        Ahora que el sitio procesa pagos reales, hazlo revisar por alguien con conocimiento legal en tu jurisdicción
        antes de tratarlo como definitivo.
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Estos Términos constituyen un acuerdo legal entre tú ("Usuario") y {LEGAL_ENTITY_TYPE} ("K-pop Wars",
        "nosotros"), operador del sitio kpopwars.com. Si necesitas los datos completos de identificación del
        responsable (por ejemplo, para fines legales o de cumplimiento), escríbenos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <LegalSection title="1. Qué es K-pop Wars">
        <p>
          K-pop Wars es un ranking público donde cualquier persona puede hacer una aportación económica voluntaria
          ("puja") para que un grupo de K-pop suba en el total acumulado de aportaciones y, con eso, en el puesto
          que ocupa en el ranking. Al usar el sitio o completar un pago, aceptas estos Términos y nuestra{' '}
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
          . En caso de contradicción, estos Términos tienen prioridad.
        </p>
      </LegalSection>

      <LegalSection title="2. Naturaleza de la aportación — no es apuesta, no es inversión, no es compra">
        <p>
          Tu aportación es una donación/apoyo voluntario e irrevocable a favor de un grupo, sin contraprestación
          económica de ningún tipo. Específicamente, al pagar entiendes y aceptas que:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            No participas en ningún juego de azar, sorteo, rifa ni apuesta. El resultado (posición en el ranking) no
            depende del azar sino exclusivamente de la suma acumulada de aportaciones de todos los usuarios,
            información que es pública en todo momento antes de pagar.
          </li>
          <li>
            No adquieres ninguna acción, participación societaria, token, activo digital, ni derecho de retorno
            económico presente o futuro.
          </li>
          <li>
            No compras exclusividad, un puesto garantizado, ni un puesto por un tiempo determinado. Otro usuario
            puede aportar más en cualquier momento y tu grupo puede bajar de posición inmediatamente después de tu
            pago.
          </li>
          <li>
            Tu aportación no constituye una compra de bien o servicio digital entregable; es una contribución a un
            marcador público de comunidad de fans (fandom).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Elegibilidad">
        <p>
          Debes tener capacidad legal para celebrar contratos en tu jurisdicción de residencia (generalmente 18
          años o la mayoría de edad local). K-pop Wars no verifica edad ni identidad de los usuarios. Si eres menor
          de edad, no debes usar un método de pago sin la autorización expresa del titular de dicho método, y el
          titular asume toda responsabilidad por su uso. K-pop Wars no asume responsabilidad por el uso no
          autorizado de métodos de pago por parte de terceros, sin perjuicio de los derechos que la ley otorgue al
          titular del método de pago frente a su banco o procesador.
        </p>
        <p>
          No puedes usar el sitio si resides en un país o territorio sujeto a sanciones comerciales aplicables
          (incluyendo, sin limitarse a, las listas de sanciones de OFAC/EE. UU., UE, Reino Unido y Naciones Unidas),
          ni si las leyes de tu país prohíben este tipo de aportaciones.
        </p>
      </LegalSection>

      <LegalSection title="4. Pagos">
        <p>
          Los pagos se procesan a través de Stripe, Inc. Nosotros nunca recibimos ni almacenamos el número completo
          de tu tarjeta ni datos financieros sensibles — eso lo maneja Stripe directamente conforme a estándares
          PCI-DSS. Los términos y política de privacidad de Stripe también aplican al procesamiento del pago.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Monto mínimo por aportación: ${(BID_LIMITS.MIN_CENTS / 100).toFixed(2)} USD.</li>
          <li>Monto máximo por transacción individual: ${(BID_LIMITS.MAX_PER_TX_CENTS / 100).toLocaleString('es-MX')} USD.</li>
          <li>
            Nos reservamos el derecho de solicitar verificación adicional de identidad para aportaciones que,
            individualmente o de forma acumulada, superen montos que consideremos atípicos, o de rechazar/reembolsar
            transacciones que no puedan verificarse, conforme a nuestras obligaciones legales y las de nuestro
            procesador de pagos.
          </li>
          <li>
            El monto de tu aportación se refleja en el total acumulado de tu grupo una vez que el pago es confirmado
            por Stripe.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Reembolsos">
        <p>
          Como regla general, las aportaciones son finales y no reembolsables una vez confirmado el pago, dado que
          el servicio (reflejar tu aportación en el ranking público) se presta de forma inmediata y completa en ese
          momento.
        </p>
        <p className="font-semibold">Excepciones:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Evaluamos reembolsos ante errores técnicos comprobables de nuestro lado (ej. cobro duplicado, monto incorrecto).</li>
          <li>
            Si resides en una jurisdicción donde la ley te otorga un derecho de desistimiento u otro derecho
            irrenunciable sobre compras digitales (por ejemplo, normativa de protección al consumidor de la Unión
            Europea), dicho derecho aplica en la medida en que la ley lo exija, y prevalece sobre esta sección.
            Puedes ejercerlo escribiendo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
              {CONTACT_EMAIL}
            </a>
            .
          </li>
          <li>
            Nos reservamos el derecho de revertir o anular aportaciones asociadas a fraude, uso no autorizado de un
            método de pago, o contracargo (chargeback) confirmado, incluyendo el ajuste correspondiente del ranking.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Contenido y conducta">
        <p>
          No está permitido usar nombres, imágenes o enlaces que sean ofensivos, ilegales, difamatorios, que
          infrinjan derechos de propiedad intelectual, o que suplanten la identidad de un tercero (incluyendo grupos
          de K-pop, sus miembros o sus agencias) sin autorización, ni enlaces a contenido ilegal o malicioso.
        </p>
        <p>
          Nos reservamos el derecho de ocultar, editar o eliminar cualquier aportación, nombre, imagen o enlace que
          viole esto, sin obligación de reembolso, y de suspender o bloquear el acceso de quien lo haga de forma
          repetida o grave.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual de terceros">
        <p>
          K-pop Wars no está afiliado, patrocinado ni respaldado por ningún grupo de K-pop, agencia de
          entretenimiento, o sello discográfico mencionado en el sitio. Usamos nombres, fotos y logotipos de grupos
          únicamente para identificar de qué grupo se trata cada tarjeta del ranking — no como marca propia, y sin
          insinuar que ese grupo o su agencia respaldan, operan o participan en K-pop Wars. Ese uso identificativo
          mínimo (nombre y una imagen del grupo, nada más) busca ampararse en las excepciones de uso referencial de
          marcas y obra que reconocen tanto la legislación mexicana como, en términos generales, otras
          jurisdicciones — pero no sustituye el análisis legal de tu caso si tienes dudas específicas.
        </p>
        <p>
          Si eres el titular de los derechos sobre un nombre, imagen o logotipo mostrado en el sitio y quieres que lo
          retiremos o corrijamos, escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>{' '}
          incluyendo: (1) tu nombre y datos de contacto; (2) la URL exacta de la página o tarjeta en cuestión; (3)
          una descripción de qué contenido quieres que se retire o corrija y por qué; y (4) una declaración de que
          eres el titular de esos derechos o estás autorizado para actuar en su nombre. Revisamos y respondemos
          estas solicitudes a la brevedad. Retirar contenido no revierte pujas ya confirmadas — el total acumulado
          de ese grupo permanece igual.
        </p>
      </LegalSection>

      <LegalSection title={'8. El servicio se ofrece "tal cual"'}>
        <p>
          K-pop Wars se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o
          implícitas, incluyendo garantías implícitas de comerciabilidad, idoneidad para un fin particular, o no
          infracción. No garantizamos que el sitio esté libre de errores, interrupciones, o que un puesto específico
          se mantenga por un tiempo determinado.
        </p>
      </LegalSection>

      <LegalSection title="9. Límite de responsabilidad">
        <p>
          En la máxima medida que permita la ley aplicable, no seremos responsables por daños indirectos,
          incidentales, especiales, consecuentes o punitivos derivados del uso del sitio, incluso si se nos advirtió
          de su posibilidad. Nuestra responsabilidad total agregada frente a ti, por cualquier causa, no superará el
          monto que hayas pagado a través del sitio en los últimos 3 meses. Nada en esta sección limita
          responsabilidad por dolo, negligencia grave, o cualquier otra responsabilidad que no pueda excluirse
          conforme a la ley aplicable.
        </p>
      </LegalSection>

      <LegalSection title="10. Indemnización">
        <p>
          Aceptas mantener indemne a K-pop Wars, sus operadores y colaboradores frente a cualquier reclamo de
          terceros derivado de: (a) tu incumplimiento de estos Términos, (b) contenido, nombres o enlaces que hayas
          publicado, o (c) tu uso no autorizado de un método de pago.
        </p>
      </LegalSection>

      <LegalSection title="11. Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos en cualquier momento. Si el cambio es significativo, lo anunciaremos en
          el sitio con al menos {CHANGE_NOTICE_DAYS} días de anticipación cuando sea razonablemente posible. Seguir
          usando K-pop Wars después de que un cambio entre en vigor implica su aceptación.
        </p>
      </LegalSection>

      <LegalSection title="12. Ley aplicable y resolución de disputas">
        <p>
          Estos Términos se rigen por las leyes de {GOVERNING_LAW}, sin dar efecto a sus normas de conflicto de
          leyes.
        </p>
        <p>
          Si tu país o región te otorga derechos de protección al consumidor u otros derechos que no pueden
          renunciarse por contrato, esos derechos siguen aplicando sin importar lo anterior.
        </p>
        <p>
          Antes de iniciar cualquier acción legal, te pedimos escribirnos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>{' '}
          para intentar resolver el problema directamente; responderemos en un plazo razonable. Esto no limita tu
          derecho a acudir a la autoridad competente de tu jurisdicción en cualquier momento cuando la ley así te lo
          garantice.
        </p>
      </LegalSection>

      <LegalSection title="13. Disposiciones generales">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Si alguna parte de estos Términos resulta inválida o inaplicable, el resto sigue teniendo efecto
            completo, y esa parte se sustituye por la disposición válida que más se acerque a su intención original.
          </li>
          <li>
            Que no hagamos cumplir una disposición en un caso puntual no significa que renunciemos a hacerla cumplir
            después. No puedes ceder tus derechos u obligaciones bajo estos Términos sin nuestro consentimiento;
            nosotros sí podemos cederlos si transferimos la operación del sitio.
          </li>
          <li>
            Estos Términos, junto con las Reglas y la Política de Privacidad, son el acuerdo completo entre tú y
            nosotros respecto al uso del sitio, y sustituyen cualquier entendimiento previo sobre el mismo tema.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="14. Contacto">
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
