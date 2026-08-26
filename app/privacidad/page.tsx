import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacidad — El Trono',
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" subtitle="Qué datos usamos y por qué.">
      <div className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg p-3">
        Esta es una plantilla base que describe lo que el sitio realmente hace hoy. Revísala con alguien con
        conocimiento legal antes de tratarla como definitiva, sobre todo si vas a operar en una región con reglas
        específicas de protección de datos (como el RGPD en la Unión Europea).
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
          <strong>Datos técnicos básicos:</strong> nuestro proveedor de hosting (Vercel) y nuestra base de datos
          (Supabase) procesan automáticamente datos estándar de cada solicitud (como la dirección IP) para operar y
          proteger el sitio. No usamos esto para armar un perfil de cada visitante.
        </p>
        <p>
          <strong>Contador de visitas y "en línea":</strong> llevamos un conteo total de cargas de página y un
          conteo de cuántas personas están conectadas en este momento. Ninguno de los dos identifica quién eres —
          son solo números agregados.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies y almacenamiento local">
        <p>
          El Trono no usa cookies de rastreo ni de publicidad. Guardamos tu preferencia de tema (claro/oscuro) en el
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
          feed de actividad — es la naturaleza del servicio. Si pujaste de forma anónima, nunca guardamos tu nombre
          ni tu link en primer lugar.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus opciones">
        <p>
          Puedes pujar sin dar tu nombre ni tu red social usando la opción "pujar de forma anónima". Si ya pujaste
          con tu nombre y quieres que lo quitemos del feed público, contáctanos y lo evaluamos caso por caso (el
          monto de la puja se queda, ya que forma parte del ranking público, pero podemos anonimizar el nombre
          asociado).
        </p>
      </LegalSection>

      <LegalSection title="6. Menores de edad">
        <p>
          El Trono no está dirigido a niños. Si eres menor de edad, necesitas la autorización de un adulto
          responsable del método de pago antes de usar el sitio.
        </p>
      </LegalSection>

      <LegalSection title="7. Cambios a esta política">
        <p>Podemos actualizar esta política conforme el sitio crece. Si el cambio es importante, lo anunciaremos aquí.</p>
      </LegalSection>

      <LegalSection title="8. Contacto">
        <p>¿Dudas sobre tus datos? Contáctanos directamente por los canales del sitio.</p>
      </LegalSection>
    </LegalPage>
  );
}
