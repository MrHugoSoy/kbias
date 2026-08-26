import { Crown, Mic2, Plus, Zap, ShieldCheck, Trophy, Handshake, HelpCircle, Heart, HeartHandshake, VenetianMask } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import BidButton from '@/components/BidButton';
import ActivityFeed from '@/components/ActivityFeed';
import BidForm from '@/components/BidForm';
import OnlineBar from '@/components/OnlineBar';
import DonorSidebar from '@/components/DonorSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { FooterLinks } from '@/components/LegalPage';

export const revalidate = 0; // siempre datos frescos, el ranking cambia en cualquier momento

type Supporter = {
  supporter_name: string | null;
  is_anonymous: boolean | null;
  social_url: string | null;
};

// Nombre del donador, como link a su red social si la puso (nunca si es anónimo).
function renderSupporter(entry: Supporter) {
  if (entry.is_anonymous) {
    return (
      <span className="inline-flex items-center gap-1">
        <VenetianMask className="w-3.5 h-3.5" /> un fan anónimo
      </span>
    );
  }
  if (entry.social_url) {
    return (
      <a
        href={entry.social_url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-pink-400"
      >
        {entry.supporter_name || 'un fan'}
      </a>
    );
  }
  return entry.supporter_name || 'un fan';
}

type RankingRow = {
  group_id: string;
  group_name: string;
  fandom_name: string | null;
  image_url: string | null;
  total_donated_cents: number;
  top_supporter_name: string | null;
  top_is_anonymous: boolean | null;
  top_social_url: string | null;
};

// Tarjeta de ranking: 'lg' es el #1, 'md' el #2/#3, 'sm' el #4-8 (compacta, cabe 5 en una fila).
function RankCard({
  rank,
  group,
  size,
  topDonor,
  orderClassName,
}: {
  rank: number;
  group: RankingRow;
  size: 'lg' | 'md' | 'sm';
  topDonor?: { supporter_name: string | null; total_donated_cents: number } | null;
  orderClassName?: string;
}) {
  const isThrone = size === 'lg';
  const isCompact = size === 'sm';

  return (
    <div
      className={
        (isThrone
          ? 'relative border-2 border-pink-600 rounded-2xl p-6 text-center space-y-2 bg-gradient-to-b from-pink-100 to-white dark:from-pink-950/30 dark:to-black'
          : isCompact
            ? 'relative border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center space-y-1 bg-white dark:bg-neutral-950'
            : 'relative border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center space-y-2 bg-white dark:bg-neutral-950') +
        (orderClassName ? ' ' + orderClassName : '')
      }
    >
      <p
        className={
          (isCompact ? 'text-[10px] tracking-[0.2em]' : 'text-xs tracking-[0.3em]') +
          ' text-pink-400 font-semibold flex items-center justify-center gap-1'
        }
      >
        {isThrone ? (
          <>
            <Crown className="w-3.5 h-3.5" /> #1 · EL TRONO
          </>
        ) : (
          `#${rank}`
        )}
      </p>
      <div
        className={
          (isThrone
            ? 'w-32 h-32 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden'
            : isCompact
              ? 'w-12 h-12 mx-auto rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden'
              : 'w-20 h-20 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden') +
          ' relative transition-transform duration-200 hover:z-20 ' +
          (isThrone ? 'hover:scale-150' : isCompact ? 'hover:scale-[3.5]' : 'hover:scale-[2]')
        }
      >
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
        ) : (
          <Mic2 className={(isThrone ? 'w-12 h-12' : isCompact ? 'w-5 h-5' : 'w-8 h-8') + ' text-neutral-500 dark:text-neutral-600'} />
        )}
      </div>
      <h2 className={isThrone ? 'text-3xl font-black tracking-tight' : isCompact ? 'text-xs font-bold truncate' : 'text-lg font-bold'}>
        {group.group_name}
      </h2>
      {group.fandom_name && !isCompact && (
        <p className="text-pink-400 text-sm font-semibold flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 fill-current" /> {group.fandom_name} <Heart className="w-3 h-3 fill-current" />
        </p>
      )}
      <p
        className={
          isThrone
            ? 'text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono'
            : isCompact
              ? 'text-sm font-bold text-amber-400 font-mono'
              : 'text-xl font-bold text-amber-400 font-mono'
        }
      >
        ${(group.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
      {!isCompact && (
        <p className="text-xs text-neutral-500">
          {group.total_donated_cents === 0 ? (
            'Nadie ha pujado aún'
          ) : (
            <>
              liderado por{' '}
              {renderSupporter({
                supporter_name: group.top_supporter_name,
                is_anonymous: group.top_is_anonymous,
                social_url: group.top_social_url,
              })}
            </>
          )}
        </p>
      )}
      {isThrone && topDonor?.supporter_name && (
        <p className="text-xs text-neutral-600">
          Mayor fan: <span className="text-pink-300 font-semibold">{topDonor.supporter_name}</span> — $
          {(topDonor.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      )}
      <div className={isCompact ? 'pt-0.5' : 'pt-1'}>
        <BidButton groupId={group.group_id} groupName={group.group_name} compact={isCompact} />
      </div>
    </div>
  );
}

// Puesto todavía sin reclamar — mantiene el hueco visible en vez de desaparecer.
function EmptySlotCard({ rank, size, orderClassName }: { rank: number; size: 'lg' | 'md' | 'sm'; orderClassName?: string }) {
  const isThrone = size === 'lg';
  const isCompact = size === 'sm';

  return (
    <div
      className={
        (isThrone
          ? 'relative border-2 border-dashed border-pink-700/60 rounded-2xl p-6 text-center space-y-2 bg-pink-600/5 hover:border-pink-500 hover:bg-pink-600/10 transition'
          : isCompact
            ? 'relative border border-dashed border-pink-800/50 rounded-xl p-3 text-center space-y-1 bg-pink-600/5 hover:border-pink-500 transition'
            : 'relative border border-dashed border-pink-800/50 rounded-2xl p-5 text-center space-y-2 bg-pink-600/5 hover:border-pink-500 transition') +
        (orderClassName ? ' ' + orderClassName : '')
      }
    >
      <p className={isCompact ? 'text-[10px] tracking-[0.2em] text-pink-500/70 font-bold' : 'text-xs tracking-[0.3em] text-pink-500/70 font-bold'}>
        #{rank}
      </p>
      <div
        className={
          isThrone
            ? 'w-32 h-32 mx-auto rounded-full border-2 border-dashed border-pink-600/60 flex items-center justify-center animate-pulse'
            : isCompact
              ? 'w-12 h-12 mx-auto rounded-full border border-dashed border-pink-700/60 flex items-center justify-center'
              : 'w-20 h-20 mx-auto rounded-full border-2 border-dashed border-pink-700/60 flex items-center justify-center'
        }
      >
        <Plus className={(isThrone ? 'w-10 h-10' : isCompact ? 'w-4 h-4' : 'w-7 h-7') + ' text-pink-500'} />
      </div>
      <p className={isThrone ? 'text-xl font-black text-pink-400' : isCompact ? 'text-[10px] font-bold text-pink-400' : 'text-sm font-bold text-pink-400'}>
        ¡Disponible!
      </p>
      {!isCompact && <p className="text-xs text-neutral-500">Sé el primero en reclamarlo</p>}
    </div>
  );
}

export default async function Home() {
  const supabase = getSupabasePublicClient();

  const { data: feed, error: feedError } = await supabase.from('activity_feed').select('*');
  const { data: groups, error: groupsError } = await supabase.from('groups').select('*').order('name');
  const { data: rankings, error: rankingsError } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_donated_cents', { ascending: false });

  if (feedError || groupsError || rankingsError) {
    console.error('Error cargando datos de Supabase:', { feedError, groupsError, rankingsError });
  }

  // Solo los grupos que ya recibieron al menos una puja ocupan un puesto en el podio.
  // Sin eso, se llenaría el top 8 con grupos en $0.00 solo por orden alfabético.
  const bidded = (rankings ?? []).filter((r) => r.total_donated_cents > 0);
  const unbidded = (rankings ?? []).filter((r) => r.total_donated_cents === 0);

  // Mayor donador (no anónimo) del grupo que tiene el trono ahora mismo (el #1 del ranking).
  const { data: topDonor } = bidded[0]
    ? await supabase
        .from('top_donor_per_group')
        .select('*')
        .eq('group_id', bidded[0].group_id)
        .maybeSingle()
    : { data: null };
  const top3 = bidded.slice(0, 3);
  const midFive = bidded.slice(3, 8);
  const rest = [...bidded.slice(8), ...unbidded];
  // Solo los primeros `rankedOverflowCount` de `rest` tienen puja real (rank #9+ legítimo);
  // el resto son bandas sin pujas y no deben mostrar número de puesto.
  const rankedOverflowCount = Math.max(bidded.length - 8, 0);

  // Contador de visitas: incrementa y lee el total en una sola llamada atómica (RPC).
  const { data: totalVisits } = await supabase.rpc('increment_site_visits');
  const { data: totalRaised } = await supabase.from('total_raised').select('*').maybeSingle();

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-[#0a0a0c] dark:text-white transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-900 max-w-4xl xl:max-w-[75.5rem] mx-auto">
        <div className="flex items-center gap-2">
          <Crown className="w-7 h-7 text-pink-500 fill-pink-500/20" />
          <div>
            <p className="font-extrabold tracking-tight leading-none">EL TRONO</p>
            <p className="text-[10px] text-pink-400 tracking-widest">EL PODER ES DE LOS FANS</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="#" className="text-pink-500 border-b-2 border-pink-500 pb-1">INICIO</a>
            <a href="#ranking">RANKING</a>
            <a href="#como-funciona">CÓMO FUNCIONA</a>
            <a href="#historial">HISTORIAL</a>
            <a href="#faq">FAQ</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-4xl xl:max-w-[75.5rem] mx-auto px-4 py-8 space-y-10">
        <OnlineBar totalVisits={totalVisits ?? 0} />

        {/* Podio: top 3 */}
        <section id="ranking" className="space-y-4">
          {top3.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <Crown className="w-16 h-16 mx-auto text-pink-500 fill-pink-500/20 animate-bounce" />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-pink-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(236,72,153,0.35)]">
                El trono está vacío
              </h1>
              <p className="text-pink-500 dark:text-pink-400 text-xs font-semibold tracking-[0.3em] uppercase">
                ✦ Sé el primero en reclamarlo ✦
              </p>
            </div>
          )}

          <div className="relative grid sm:grid-cols-3 gap-4">
            <div className="hidden sm:block absolute inset-0 bg-pink-600/10 blur-3xl rounded-full -z-10" />
            {[0, 1, 2].map((i) => {
              const r = top3[i];
              const orderClassName = i === 0 ? 'sm:order-2' : i === 1 ? 'sm:order-1' : 'sm:order-3';
              if (!r) return <EmptySlotCard key={i} rank={i + 1} size={i === 0 ? 'lg' : 'md'} orderClassName={orderClassName} />;
              return (
                <RankCard
                  key={r.group_id}
                  rank={i + 1}
                  group={r}
                  size={i === 0 ? 'lg' : 'md'}
                  topDonor={i === 0 ? topDonor : undefined}
                  orderClassName={orderClassName}
                />
              );
            })}
          </div>

          {/* Siguientes 5, tarjetas compactas — las 5 caben en una sola fila */}
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const r = midFive[i];
              if (!r) return <EmptySlotCard key={i} rank={i + 4} size="sm" />;
              return <RankCard key={r.group_id} rank={i + 4} group={r} size="sm" />;
            })}
          </div>

          {/* Debajo del top 8: sidebar de donadores en vivo + resto de las bandas, uno al lado del otro */}
          <div className="flex gap-6">
            <aside className="hidden lg:block w-64 shrink-0 sticky top-8 self-start">
              <DonorSidebar initialItems={feed ?? []} />
            </aside>

            {rest.length > 0 && (
              <div className="flex-1 min-w-0 space-y-2">
                {rest.map((r, i) => (
                  <div key={r.group_id} className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      {i < rankedOverflowCount && (
                        <span className="text-neutral-600 font-mono text-sm w-6 text-center">#{i + 9}</span>
                      )}
                      <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center relative transition-transform duration-200 hover:scale-[3.5] hover:z-20">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                        ) : (
                          <Mic2 className="w-5 h-5 text-neutral-500 dark:text-neutral-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{r.group_name}</p>
                        <p className="text-xs text-pink-400">{r.fandom_name}</p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total donado</p>
                      <p className="text-pink-400 font-mono text-sm">
                        {r.total_donated_cents > 0
                          ? `$${(r.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : 'Sin pujas'}
                      </p>
                    </div>
                    <BidButton groupId={r.group_id} groupName={r.group_name} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" /> ¿CÓMO FUNCIONA?
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">01</p>
              <p className="font-semibold">Elige tu grupo</p>
              <p className="text-sm text-neutral-500">Escoge al grupo por el que quieres pujar en la lista de competidores.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">02</p>
              <p className="font-semibold">Dona lo que quieras</p>
              <p className="text-sm text-neutral-500">No hay mínimo para "tomar la delantera". Cada puja, sin importar el monto, se suma al total de tu grupo.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">03</p>
              <p className="font-semibold">Paga de forma segura</p>
              <p className="text-sm text-neutral-500">El pago se procesa con Stripe. Tu puja solo cuenta si el cobro se confirma.</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">04</p>
              <p className="font-semibold">Tu grupo sube en el ranking</p>
              <p className="text-sm text-neutral-500">El total se actualiza al instante. El #1 se mantiene hasta que otro grupo acumule más en total.</p>
            </div>
          </div>
        </section>

        {/* Total recaudado + mensaje de caridad */}
        <div className="text-center py-2">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Este proyecto ha recaudado</p>
          <p className="text-4xl sm:text-5xl font-black text-amber-400 font-mono drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            ${((totalRaised?.total_cents ?? 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-pink-400 mt-2 flex items-center justify-center gap-1">
            <HeartHandshake className="w-4 h-4" /> El 5% de cada puja se dona a fundaciones caritativas
          </p>
        </div>

        {/* Actividad en vivo — oculta en lg+ porque ahí ya está el sidebar de donadores mostrando lo mismo */}
        <div className="lg:hidden">
          <ActivityFeed initialItems={feed ?? []} />
        </div>

        {/* FAQ */}
        <section id="faq" className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-pink-500" /> FAQ
          </h2>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 rounded-xl overflow-hidden">
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Esto es una apuesta?</p>
              <p className="text-sm text-neutral-500">No. Es un apoyo/tip a tu grupo favorito. No hay premio ni retorno económico para quien paga.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Puedo recuperar mi dinero?</p>
              <p className="text-sm text-neutral-500">Las pujas no son reembolsables, salvo error técnico comprobado.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">¿Cómo se decide quién tiene el #1?</p>
              <p className="text-sm text-neutral-500">Gana el grupo cuya comunidad haya donado más EN TOTAL — se suman todas las pujas exitosas que ha recibido ese grupo, no solo la más grande.</p>
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

        {/* Formulario de puja */}
        <BidForm groups={groups ?? []} />

        {/* Footer de confianza */}
        <footer className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-neutral-500 pt-6 border-t border-neutral-200 dark:border-neutral-900">
          <div>
            <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">PAGO SEGURO</p>
            <p>Tus transacciones están protegidas y encriptadas.</p>
          </div>
          <div>
            <Zap className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">SIN RESETS</p>
            <p>El #1 se mantiene hasta que otro grupo done más en total.</p>
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
