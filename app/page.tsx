import Link from 'next/link';
import { Zap, ShieldCheck, Trophy, Handshake, HelpCircle } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import ActivityFeed from '@/components/ActivityFeed';
import BidForm from '@/components/BidForm';
import OnlineBar from '@/components/OnlineBar';
import RankingBoard from '@/components/RankingBoard';
import CommunityPointsTotal from '@/components/CommunityPointsTotal';
import SiteHeader from '@/components/SiteHeader';
import { FooterLinks } from '@/components/LegalPage';

export const revalidate = 0; // siempre datos frescos, el ranking cambia en cualquier momento

export default async function Home() {
  const supabase = getSupabasePublicClient();

  const { data: feed, error: feedError } = await supabase.from('vote_feed').select('*');
  const { data: groups, error: groupsError } = await supabase.from('groups').select('*').order('name');
  const { data: rankings, error: rankingsError } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_points', { ascending: false });

  if (feedError || groupsError || rankingsError) {
    console.error('Error cargando datos de Supabase:', { feedError, groupsError, rankingsError });
  }

  // El ranking (group_rankings) cuenta solo los votos del mes calendario
  // (UTC) en curso — se "reinicia" solo, sin ningún borrado ni cron, al
  // entrar el mes nuevo. Estas dos fechas son solo para el texto de abajo.
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextMonthLabel = nextMonthStart.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' });

  // Contador de visitas: incrementa y lee el total en una sola llamada atómica (RPC).
  // Se salta en local (`npm run dev`) para que las pruebas no inflen el número real.
  const { data: totalVisits } =
    process.env.NODE_ENV === 'production'
      ? await supabase.rpc('increment_site_visits')
      : await supabase.from('site_stats').select('total_visits').eq('id', 1).maybeSingle().then((r) => ({ data: r.data?.total_visits ?? 0 }));

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-[#0a0a0c] dark:text-white transition-colors">
      <SiteHeader home />

      <div className="max-w-4xl xl:max-w-[75.5rem] mx-auto px-4 py-8 space-y-10">
        <OnlineBar totalVisits={totalVisits ?? 0} />

        {/* Podio: top 3 */}
        <RankingBoard
          initialRankings={rankings ?? []}
          feed={feed ?? []}
          currentMonthLabel={currentMonthLabel}
          nextMonthLabel={nextMonthLabel}
        />

        {/* Panel de voto — pegado al ranking para que no haya que bajar tanto */}
        <BidForm groups={groups ?? []} />

        {/* Actividad en vivo — oculta en lg+ porque ahí ya está el sidebar de donadores mostrando lo mismo */}
        <div id="historial-mobile" className="lg:hidden">
          <ActivityFeed initialItems={feed ?? []} />
        </div>

        {/* Total de votos */}
        <CommunityPointsTotal initialRankings={rankings ?? []} />

        {/* Cómo funciona */}
        <section id="como-funciona" className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" /> ¿CÓMO FUNCIONA?
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">01</p>
              <p className="font-semibold">Crea tu cuenta gratis</p>
              <p className="text-sm text-neutral-500">Solo necesitas un correo y una contraseña — sin costo, sin tarjeta.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">02</p>
              <p className="font-semibold">Elige tu grupo</p>
              <p className="text-sm text-neutral-500">Escoge uno o varios grupos de la lista de competidores.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">03</p>
              <p className="font-semibold">Reparte tus puntos — es gratis</p>
              <p className="text-sm text-neutral-500">5 puntos por cuenta cada día. Dáselos todos a uno o repártelos entre varios.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">04</p>
              <p className="font-semibold">Tu grupo sube en el ranking</p>
              <p className="text-sm text-neutral-500">El total se actualiza al instante. El #1 se mantiene hasta que otro grupo acumule más puntos ese mes.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-pink-500" /> FAQ
          </h2>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 rounded-xl overflow-hidden">
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Cuesta dinero votar?</p>
              <p className="text-sm text-neutral-500">No, votar es completamente gratis. Solo necesitas una cuenta para evitar que alguien vote varias veces.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Por qué necesito una cuenta?</p>
              <p className="text-sm text-neutral-500">Para que el ranking refleje personas reales — sin cuenta, cualquiera podría votar cientos de veces por su grupo.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Cuántos puntos tengo?</p>
              <p className="text-sm text-neutral-500">5 puntos por cuenta cada día calendario (UTC) — puedes dárselos todos a un grupo o repartirlos entre varios.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Cómo se decide quién tiene el #1?</p>
              <p className="text-sm text-neutral-500">
                Gana el grupo con más puntos acumulados en el mes calendario en curso. El ranking se reinicia el día 1
                de cada mes — los campeones de meses anteriores quedan en el{' '}
                <Link href="/salon-de-la-fama" className="underline hover:text-pink-400">
                  Salón de la Fama
                </Link>
                .
              </p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">Represento a un grupo, ¿puedo reclamar su perfil?</p>
              <p className="text-sm text-neutral-500">
                Sí —{' '}
                <a href="/reclamar" className="underline hover:text-pink-400">
                  envía tu solicitud aquí
                </a>
                . La revisamos a mano contra el link de verificación que dejes.
              </p>
            </div>
          </div>
        </section>

        {/* Footer de confianza */}
        <footer className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-neutral-500 pt-6 border-t border-neutral-200 dark:border-neutral-900">
          <div>
            <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">100% GRATIS</p>
            <p>Votar no cuesta nada. Solo necesitas una cuenta.</p>
          </div>
          <div>
            <Zap className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">RANKING MENSUAL</p>
            <p>El #1 se mantiene hasta que otro grupo acumule más puntos ese mes.</p>
          </div>
          <div>
            <Trophy className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">UN SOLO TRONO</p>
            <p>No hay categorías. Solo uno puede reinar.</p>
          </div>
          <div>
            <Handshake className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">EL PODER ES DE LOS FANS</p>
            <p>Tú decides quién reina en el mundo del K-pop.</p>
          </div>
        </footer>

        <FooterLinks />
      </div>
    </main>
  );
}
