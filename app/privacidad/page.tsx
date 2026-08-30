import { LegalPage, LegalSection } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Privacidad',
  description: 'Qué datos usa K-pop Wars y por qué: solo tu correo para crear una cuenta y votar.',
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
        Lo único que pedimos es tu correo y una contraseña, para crear tu cuenta y limitar a un voto diario por
        persona. No pedimos nombre, teléfono, ni ningún dato de pago — votar es gratis.
      </div>

      <LegalSection title="1. Qué recopilamos">
        <p>
          <strong>Correo y contraseña:</strong> los usa nuestro proveedor de autenticación (Supabase Auth) para
          crear y verificar tu cuenta. La contraseña se guarda con hash (cifrado de un solo sentido) — nosotros no
          podemos ver tu contraseña en texto plano.
        </p>
        <p>
          <strong>Historial de tus votos:</strong> guardamos qué grupo elegiste y cuándo, asociado a tu cuenta, para
          hacer cumplir el límite de un voto por día y para armar el ranking público. El ranking público solo
          muestra el total de votos por grupo — nunca tu correo ni tu identidad.
        </p>
        <p>
          <strong>Contador de visitas y "en línea":</strong> llevamos un conteo total de cargas de página y un
          conteo de cuántas personas están conectadas en este momento. Ninguno de los dos identifica quién eres —
          son solo números agregados.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies y almacenamiento local">
        <p>
          K-pop Wars no usa cookies de rastreo ni de publicidad. Guardamos tu sesión (para que no tengas que iniciar
          sesión cada vez) y tu preferencia de tema (claro/oscuro) en el almacenamiento local de tu navegador
          (localStorage), que se queda en tu dispositivo.
        </p>
      </LegalSection>

      <LegalSection title="3. Con quién compartimos datos">
        <p>Usamos estos proveedores para operar el sitio, cada uno con su propia política de privacidad:</p>
        <p>
          <strong>Supabase</strong> — nuestra base de datos, autenticación, y el feed en tiempo real.
          <br />
          <strong>Vercel</strong> — hospeda el sitio.
        </p>
        <p>No vendemos tus datos a nadie, ni los usamos para publicidad de terceros.</p>
      </LegalSection>

      <LegalSection title="4. Cuánto tiempo guardamos los datos">
        <p>
          Tu cuenta y el historial de tus votos se guardan mientras tu cuenta exista. Si quieres que eliminemos tu
          cuenta y tus datos, escríbenos (ver Sección 7) — el total de votos ya emitidos permanece en el ranking
          público (es un número agregado, no identifica tu cuenta), pero eliminamos la asociación con tu correo.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus opciones">
        <p>
          Puedes cerrar sesión en cualquier momento desde el sitio. Para eliminar tu cuenta por completo, escríbenos
          a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-pink-500 dark:hover:text-pink-400">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Menores de edad">
        <p>
          K-pop Wars no está dirigido a niños. Debes tener al menos 18 años, o la mayoría de edad en tu país, para
          crear una cuenta.
        </p>
      </LegalSection>

      <LegalSection title="7. Sin importar en qué país estés">
        <p>
          Al recopilar solo lo mínimo indispensable (correo y contraseña), buscamos cumplir de forma natural con el
          espíritu de las leyes de protección de datos más comunes, sin importar desde dónde nos visites — por
          ejemplo el RGPD en la Unión Europea/Reino Unido, o la CCPA en California, EE. UU.
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
