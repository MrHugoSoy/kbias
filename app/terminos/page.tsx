import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Términos de servicio',
  description: 'Términos de servicio de K-pop Wars: qué es el sitio, cómo funciona el voto gratuito y qué aceptas al usarlo.',
};

const LEGAL_ENTITY_TYPE = 'un operador individual con actividad empresarial en México';
const GOVERNING_LAW = 'México';
const CHANGE_NOTICE_DAYS = 15;
const LAST_UPDATED = '30 de agosto de 2026';

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de servicio" subtitle={`Última actualización: ${LAST_UPDATED}.`}>
      <div className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg p-3">
        Este documento es más completo que una plantilla básica, pero sigue sin ser una revisión de un abogado.
        Hazlo revisar por alguien con conocimiento legal en tu jurisdicción antes de tratarlo como definitivo.
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
          K-pop Wars es un ranking público y gratuito donde cualquier persona con una cuenta puede votar por un grupo
          de K-pop una vez al día. Cada voto se suma al total acumulado de ese grupo y, con eso, al puesto que ocupa
          en el ranking. K-pop Wars no cobra dinero por votar ni por ninguna otra función del sitio. Al usar el sitio
          o crear una cuenta, aceptas estos Términos y nuestra{' '}
          <a href="/privacidad" className="underline hover:text-pink-500 dark:hover:text-pink-400">
            Política de Privacidad
          </a>
          . Si no estás de acuerdo, no uses el sitio.
        </p>
        <p>
          Estos Términos se complementan con las{' '}
          <a href="/reglas" className="underline hover:text-pink-500 dark:hover:text-pink-400">
            Reglas
          </a>
          . En caso de contradicción, estos Términos tienen prioridad.
        </p>
      </LegalSection>

      <LegalSection title="2. Naturaleza del voto — no es apuesta, no es inversión, no cuesta dinero">
        <p>Al votar entiendes y aceptas que:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            No participas en ningún juego de azar, sorteo, rifa ni apuesta. El resultado (posición en el ranking) no
            depende del azar sino exclusivamente de la suma de votos de todos los usuarios, información que es
            pública en todo momento.
          </li>
          <li>No pagas nada por votar, ni recibes ni adquieres ningún bien, servicio, acción, token o activo digital.</li>
          <li>
            No compras exclusividad, un puesto garantizado, ni un puesto por un tiempo determinado. Otro grupo puede
            recibir más votos en cualquier momento y tu grupo favorito puede bajar de posición inmediatamente.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cuentas">
        <p>
          Necesitas una cuenta (correo y contraseña) para votar. Eres responsable de mantener la confidencialidad de
          tu contraseña y de toda actividad que ocurra en tu cuenta. Avísanos de inmediato si sospechas un uso no
          autorizado, escribiendo a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>
          No está permitido crear varias cuentas para votar más de una vez al día por el mismo o distinto grupo, ni
          usar bots, scripts o cualquier medio automatizado para votar. Nos reservamos el derecho de eliminar votos y
          suspender o cerrar cuentas que incumplan esto, sin previo aviso.
        </p>
      </LegalSection>

      <LegalSection title="4. Elegibilidad">
        <p>
          Debes tener al menos 18 años, o la mayoría de edad en tu jurisdicción de residencia, para crear una cuenta.
          K-pop Wars no verifica edad ni identidad de los usuarios más allá del correo usado para registrarse.
        </p>
        <p>
          No puedes usar el sitio si resides en un país o territorio sujeto a sanciones comerciales aplicables
          (incluyendo, sin limitarse a, las listas de sanciones de OFAC/EE. UU., UE, Reino Unido y Naciones Unidas).
        </p>
      </LegalSection>

      <LegalSection title="5. Contenido y conducta">
        <p>
          No está permitido usar el sitio para actividades ilegales, difamatorias, o que infrinjan derechos de
          propiedad intelectual, ni intentar manipular el ranking por fuera de las reglas descritas arriba
          (múltiples cuentas, bots, o explotar errores del sitio).
        </p>
        <p>
          Nos reservamos el derecho de suspender o bloquear el acceso de quien viole esto de forma repetida o grave.
        </p>
      </LegalSection>

      <LegalSection title="6. Propiedad intelectual de terceros">
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
          estas solicitudes a la brevedad. Retirar contenido no revierte votos ya emitidos — el total acumulado de
          ese grupo permanece igual.
        </p>
      </LegalSection>

      <LegalSection title={'7. El servicio se ofrece "tal cual"'}>
        <p>
          K-pop Wars se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o
          implícitas, incluyendo garantías implícitas de comerciabilidad, idoneidad para un fin particular, o no
          infracción. No garantizamos que el sitio esté libre de errores, interrupciones, o que un puesto específico
          se mantenga por un tiempo determinado.
        </p>
      </LegalSection>

      <LegalSection title="8. Límite de responsabilidad">
        <p>
          En la máxima medida que permita la ley aplicable, no seremos responsables por daños indirectos,
          incidentales, especiales, consecuentes o punitivos derivados del uso del sitio, incluso si se nos advirtió
          de su posibilidad. Dado que el servicio es gratuito, nuestra responsabilidad total agregada frente a ti,
          por cualquier causa, no superará $100 USD. Nada en esta sección limita responsabilidad por dolo,
          negligencia grave, o cualquier otra responsabilidad que no pueda excluirse conforme a la ley aplicable.
        </p>
      </LegalSection>

      <LegalSection title="9. Indemnización">
        <p>
          Aceptas mantener indemne a K-pop Wars, sus operadores y colaboradores frente a cualquier reclamo de
          terceros derivado de: (a) tu incumplimiento de estos Términos, (b) contenido que hayas publicado, o (c) tu
          uso no autorizado de una cuenta.
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos en cualquier momento. Si el cambio es significativo, lo anunciaremos en
          el sitio con al menos {CHANGE_NOTICE_DAYS} días de anticipación cuando sea razonablemente posible. Seguir
          usando K-pop Wars después de que un cambio entre en vigor implica su aceptación.
        </p>
      </LegalSection>

      <LegalSection title="11. Ley aplicable y resolución de disputas">
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

      <LegalSection title="12. Disposiciones generales">
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

      <LegalSection title="13. Contacto">
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
