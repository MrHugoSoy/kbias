import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Privacidad',
  description: 'Qué datos usa K-pop Wars y por qué: no pedimos cuenta ni correo para pujar.',
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" subtitle="Qué datos usamos y por qué.">
      <div className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg p-3">
        Esta es una plantilla base que describe lo que el sitio realmente hace hoy. Revísala con alguien con
        conocimiento legal antes de tratarla como definitiva, sobre todo si vas a operar en una región con reglas
        específicas de protección de datos (como el RGPD en la Unión Europea).
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        El responsable de los datos descritos en esta política es un operador individual con actividad empresarial
        en México, operador de kpopwars.com. Si necesitas sus datos completos de identificación (por ejemplo, para
        ejercer tus derechos o por una obligación de cumplimiento), escríbenos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <div className="text-sm bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 rounded-lg p-4 font-semibold">
        No pedimos cuenta ni correo para pujar. Lo único que tú decides compartir es tu nombre y/o tu link de red
        social, ambos opcionales — y si pujas de forma anónima, ni siquiera eso se guarda. La única excepción es tu
        dirección IP, que guardamos por puja exitosa únicamente para aplicar un tope de gasto diario (ver abajo).
      </div>

      <LegalSection title="1. Qué recopilamos">
        <p>
          <strong>Datos que tú decides compartir:</strong> tu nombre o el de tu fandom (opcional), un link a tu red
          social (opcional), y si eliges pujar de forma anónima, ninguno de los dos se guarda.
        </p>
        <p>
          <strong>Datos de pago:</strong> los procesa Stripe directamente. Nosotros nunca vemos ni guardamos el
          número completo de tu tarjeta — solo recibimos la confirmación de que el pago se completó y el monto.
        </p>
        <p>
          <strong>Dirección IP por puja exitosa:</strong> a diferencia de las visitas normales al sitio, sí guardamos
          la IP asociada a cada puja que se completa. Es la única forma de aplicar un tope de gasto diario y frenar
          gasto compulsivo (por ejemplo, de menores usando la tarjeta de sus papás). No la usamos para ningún otro
          fin, y no la mostramos en el ranking ni en el feed público.
        </p>
        <p>
          <strong>Datos técnicos básicos de cada visita:</strong> nuestro proveedor de hosting (Vercel) y nuestra
          base de datos (Supabase) procesan automáticamente datos estándar de cada solicitud (como la dirección IP)
          para operar y proteger el sitio, sin que nosotros los guardemos en nuestra propia base de datos salvo el
          caso de pujas exitosas descrito arriba.
        </p>
        <p>
          <strong>Contador de visitas y "en línea":</strong> llevamos un conteo total de cargas de página y un
          conteo de cuántas personas están conectadas en este momento. Ninguno de los dos identifica quién eres —
          son solo números agregados.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies y almacenamiento local">
        <p>
          K-pop Wars no usa cookies de rastreo ni de publicidad. Guardamos tu preferencia de tema (claro/oscuro) en el
          almacenamiento local de tu navegador (localStorage), que se queda en tu dispositivo y nunca se envía a
          nuestros servidores.
        </p>
      </LegalSection>

      <LegalSection title="3. Con quién compartimos datos">
        <p>Usamos estos proveedores para operar el sitio, cada uno con su propia política de privacidad:</p>
        <p>
          <strong>Stripe</strong> — procesa los pagos.
          <br />
          <strong>Supabase</strong> — nuestra base de datos y el feed en tiempo real.
          <br />
          <strong>Vercel</strong> — hospeda el sitio.
        </p>
        <p>No vendemos tus datos a nadie, ni los usamos para publicidad de terceros.</p>
      </LegalSection>

      <LegalSection title="4. Cuánto tiempo guardamos los datos">
        <p>
          El historial de pujas exitosas se guarda de forma permanente porque es lo que arma el ranking público y el
          feed de actividad — es la naturaleza del servicio. Eso incluye la dirección IP asociada a cada puja
          descrita en la sección 1: como esa fila nunca se borra, la IP queda ligada a ella de forma permanente, no
          solo temporalmente. Si pujaste de forma anónima, nunca guardamos tu nombre ni tu link en primer lugar.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus opciones">
        <p>
          Puedes pujar sin dar tu nombre ni tu red social usando la opción "pujar de forma anónima". Si ya pujaste
          con tu nombre y quieres que lo quitemos del feed público,{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            escríbenos
          </a>{' '}
          y lo evaluamos caso por caso (el monto de la puja se queda, ya que forma parte del ranking público, pero
          podemos anonimizar el nombre asociado).
        </p>
      </LegalSection>

      <LegalSection title="6. Menores de edad">
        <p>
          K-pop Wars no está dirigido a niños. Si eres menor de edad, necesitas la autorización de un adulto
          responsable del método de pago antes de usar el sitio.
        </p>
      </LegalSection>

      <LegalSection title="7. Sin importar en qué país estés">
        <p>
          Al recopilar solo lo mínimo indispensable (y nada si pujas de forma anónima), buscamos cumplir de forma
          natural con el espíritu de las leyes de protección de datos más comunes, sin importar desde dónde nos
          visites — por ejemplo el RGPD en la Unión Europea/Reino Unido, o la CCPA en California, EE. UU.
        </p>
        <p>
          Si vives en un país cuya ley te da derechos específicos sobre tus datos (acceso, corrección, eliminación,
          oposición, o retirar un consentimiento que hayas dado), puedes ejercerlos escribiendo a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>{' '}
          — dado lo poco que guardamos, la mayoría de esas solicitudes se resuelven de inmediato. Si no quedas
          conforme con nuestra respuesta, también tienes derecho a presentar una queja ante la autoridad de
          protección de datos de tu país (por ejemplo, el INAI en México, o la autoridad equivalente donde vivas).
        </p>
      </LegalSection>

      <LegalSection title="8. Cambios a esta política">
        <p>Podemos actualizar esta política conforme el sitio crece. Si el cambio es importante, lo anunciaremos aquí.</p>
      </LegalSection>

      <LegalSection title="9. Contacto">
        <p>
          ¿Dudas sobre tus datos? Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
