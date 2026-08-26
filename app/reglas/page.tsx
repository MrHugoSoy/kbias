import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';
import { BID_LIMITS } from '@/lib/stripe';

export const metadata = {
  title: 'Reglas — El Trono',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400">{title}</h2>
      <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">{children}</div>
    </section>
  );
}

export default function ReglasPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-[#0a0a0c] dark:text-white transition-colors">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-900 max-w-2xl mx-auto">
        <Crown className="w-6 h-6 text-pink-500 fill-pink-500/20" />
        <p className="font-extrabold tracking-tight">EL TRONO</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <h1 className="text-3xl font-black tracking-tight mt-3">Reglas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Cómo funciona el juego y qué se permite en El Trono.
          </p>
        </div>

        <Section title="1. Cómo se gana el #1">
          <p>
            El puesto #1 lo tiene el grupo con la puja individual exitosa más alta de todo el historial. Para tomar el
            trono, tu puja tiene que superar ese monto — aunque sea por un centavo.
          </p>
          <p>
            Las pujas anteriores de un mismo grupo <strong>no se suman</strong>. Cada puja compite por su propio
            monto, no por el total acumulado que ese grupo haya recibido.
          </p>
          <p>El #1 se mantiene hasta que alguien más pague más. No hay resets ni ciclos.</p>
        </Section>

        <Section title="2. Esto es un apoyo, no una apuesta">
          <p>
            Pujar en El Trono es un apoyo/tip a tu grupo favorito. No hay premio, sorteo ni retorno económico para
            quien paga — el único "premio" es ver a tu grupo en el #1.
          </p>
        </Section>

        <Section title="3. Montos y límites">
          <p>Monto mínimo por puja: ${(BID_LIMITS.MIN_CENTS / 100).toFixed(2)}.</p>
          <p>
            Monto máximo por transacción individual: ${(BID_LIMITS.MAX_PER_TX_CENTS / 100).toLocaleString('es-MX')}.
            Puedes hacer varias pujas si quieres superar ese límite.
          </p>
        </Section>

        <Section title="4. Reembolsos">
          <p>
            Las pujas no son reembolsables, salvo error técnico comprobado (por ejemplo, un cobro duplicado o una
            falla de nuestro sistema). Escríbenos si crees que eso pasó.
          </p>
        </Section>

        <Section title="5. Nombre, red social y anonimato">
          <p>
            Puedes pujar con tu nombre, de forma anónima, o agregando un link a tu red social para que otros fans
            puedan encontrarte. Si eliges pujar de forma anónima, tu nombre y tu link no se guardan ni se muestran.
          </p>
          <p>
            No está permitido usar nombres ofensivos, ni un link de red social que suplante la identidad de alguien
            más sin su autorización.
          </p>
        </Section>

        <Section title="6. Menores de edad">
          <p>
            Si eres menor de edad, necesitas la autorización de un adulto responsable del método de pago antes de
            pujar.
          </p>
        </Section>

        <Section title="7. Moderación">
          <p>
            Nos reservamos el derecho de ocultar o remover pujas, nombres o links que violen estas reglas, y de
            suspender el acceso de quien las incumpla de forma repetida.
          </p>
        </Section>

        <Section title="8. Donación a fundaciones">
          <p>El 5% de cada puja exitosa se dona a fundaciones caritativas.</p>
        </Section>

        <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-4">
          ¿Tienes dudas? Revisa el <Link href="/#faq" className="underline hover:text-pink-500 dark:hover:text-pink-400">FAQ</Link> o contáctanos directamente.
        </p>
      </div>
    </main>
  );
}
