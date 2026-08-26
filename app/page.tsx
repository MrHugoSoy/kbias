import { getSupabasePublicClient } from '@/lib/supabase';
import BidButton from '@/components/BidButton';
import ActivityFeed from '@/components/ActivityFeed';
import BidForm from '@/components/BidForm';
import OnlineBar from '@/components/OnlineBar';
import DonorSidebar from '@/components/DonorSidebar';

export const revalidate = 0; // siempre datos frescos, el ranking cambia en cualquier momento

type Supporter = {
  supporter_name: string | null;
  is_anonymous: boolean | null;
  social_url: string | null;
};

// Nombre del donador, como link a su red social si la puso (nunca si es anónimo).
function renderSupporter(entry: Supporter) {
  if (entry.is_anonymous) return 'un fan anónimo 🎭';
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
  best_bid_cents: number;
  top_supporter_name: string | null;
  top_is_anonymous: boolean | null;
  top_social_url: string | null;
};

// Tarjeta de ranking: 'lg' es el #1, 'md' el #2/#3, 'sm' el #4-8 (compacta, cabe 5 en una fila).
function RankCard({
  rank,
  group,
  size,
  throneCents,
  topDonor,
  orderClassName,
}: {
  rank: number;
  group: RankingRow;
  size: 'lg' | 'md' | 'sm';
  throneCents: number;
  topDonor?: { supporter_name: string | null; total_donated_cents: number } | null;
  orderClassName?: string;
}) {
  const isThrone = size === 'lg';
  const isCompact = size === 'sm';

  return (
    <div
      className={
        (isThrone
          ? 'relative border-2 border-pink-600 rounded-2xl p-6 text-center space-y-2 bg-gradient-to-b from-pink-950/30 to-black'
          : isCompact
            ? 'relative border border-neutral-800 rounded-xl p-3 text-center space-y-1 bg-neutral-950'
            : 'relative border border-neutral-800 rounded-2xl p-5 text-center space-y-2 bg-neutral-950') +
        (orderClassName ? ' ' + orderClassName : '')
      }
    >
      <p className={isCompact ? 'text-[10px] tracking-[0.2em] text-pink-400 font-semibold' : 'text-xs tracking-[0.3em] text-pink-400 font-semibold'}>
        {isThrone ? '👑 #1 · EL TRONO' : `#${rank}`}
      </p>
      <div
        className={
          isThrone
            ? 'w-32 h-32 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-800 flex items-center justify-center overflow-hidden'
            : isCompact
              ? 'w-12 h-12 mx-auto rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center overflow-hidden'
              : 'w-20 h-20 mx-auto rounded-full border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center overflow-hidden'
        }
      >
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
        ) : (
          <span className={isThrone ? 'text-4xl' : isCompact ? 'text-base' : 'text-2xl'}>🎤</span>
        )}
      </div>
      <h2 className={isThrone ? 'text-3xl font-black tracking-tight' : isCompact ? 'text-xs font-bold truncate' : 'text-lg font-bold'}>
        {group.group_name}
      </h2>
      {group.fandom_name && !isCompact && <p className="text-pink-400 text-sm font-semibold">♥ {group.fandom_name} ♥</p>}
      <p
        className={
          isThrone
            ? 'text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono'
            : isCompact
              ? 'text-sm font-bold text-amber-400 font-mono'
              : 'text-xl font-bold text-amber-400 font-mono'
        }
      >
        ${(group.best_bid_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
      {!isCompact && (
        <p className="text-xs text-neutral-500">
          {group.best_bid_cents === 0 ? (
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
        <BidButton groupId={group.group_id} groupName={group.group_name} currentThroneCents={throneCents} compact={isCompact} />
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
        <span className={isThrone ? 'text-4xl text-pink-500' : isCompact ? 'text-base text-pink-500' : 'text-2xl text-pink-500'}>+</span>
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

  const { data: throne, error: throneError } = await supabase.from('current_throne').select('*').maybeSingle();
  const { data: feed, error: feedError } = await supabase.from('activity_feed').select('*');
  const { data: groups, error: groupsError } = await supabase.from('groups').select('*').order('name');
  const { data: rankings, error: rankingsError } = await supabase
    .from('group_rankings')
    .select('*')
    .order('best_bid_cents', { ascending: false });

  // TEMPORAL: diagnóstico de por qué producción no trae datos de Supabase.
  if (throneError || feedError || groupsError || rankingsError) {
    console.error('Supabase debug:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 12),
      throneError,
      feedError,
      groupsError,
      rankingsError,
    });
  }

  // Mayor donador (no anónimo) del grupo que tiene el trono ahora mismo.
  const { data: topDonor } = throne
    ? await supabase
        .from('top_donor_per_group')
        .select('*')
        .eq('group_id', throne.group_id)
        .maybeSingle()
    : { data: null };

  const throneCents = throne?.amount_cents ?? 0;
  // Solo los grupos que ya recibieron al menos una puja ocupan un puesto en el podio.
  // Sin eso, se llenaría el top 8 con grupos en $0.00 solo por orden alfabético.
  const bidded = (rankings ?? []).filter((r) => r.best_bid_cents > 0);
  const unbidded = (rankings ?? []).filter((r) => r.best_bid_cents === 0);
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
    <main className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 max-w-4xl xl:max-w-[75.5rem] mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👑</span>
          <div>
            <p className="font-extrabold tracking-tight leading-none">EL TRONO</p>
            <p className="text-[10px] text-pink-400 tracking-widest">EL PODER ES DE LOS FANS</p>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-neutral-400">
          <a href="#" className="text-pink-500 border-b-2 border-pink-500 pb-1">INICIO</a>
          <a href="#ranking">RANKING</a>
          <a href="#como-funciona">CÓMO FUNCIONA</a>
          <a href="#historial">HISTORIAL</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <div className="max-w-4xl xl:max-w-[75.5rem] mx-auto px-4 py-8 space-y-10">
        <OnlineBar totalVisits={totalVisits ?? 0} />

        {/* Podio: top 3 */}
        <section id="ranking" className="space-y-4">
          {top3.length === 0 && (
            <div className="text-center py-4 space-y-1">
              <p className="text-5xl">👑</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">El trono está vacío</h1>
              <p className="text-neutral-500">¡Sé el primero en reclamarlo!</p>
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
                  throneCents={throneCents}
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
              return <RankCard key={r.group_id} rank={i + 4} group={r} size="sm" throneCents={throneCents} />;
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
                  <div key={r.group_id} className="flex items-center justify-between bg-neutral-900 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      {i < rankedOverflowCount && (
                        <span className="text-neutral-600 font-mono text-sm w-6 text-center">#{i + 9}</span>
                      )}
                      <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>🎤</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{r.group_name}</p>
                        <p className="text-xs text-pink-400">{r.fandom_name}</p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Su mejor puja</p>
                      <p className="text-pink-400 font-mono text-sm">
                        {r.best_bid_cents > 0
                          ? `$${(r.best_bid_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : 'Sin pujas'}
                      </p>
                    </div>
                    <BidButton groupId={r.group_id} groupName={r.group_name} currentThroneCents={throneCents} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">⚡ ¿CÓMO FUNCIONA?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">01</p>
              <p className="font-semibold">Elige tu grupo</p>
              <p className="text-sm text-neutral-500">Escoge al grupo por el que quieres pujar en la lista de competidores.</p>
            </div>
            <div className="bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">02</p>
              <p className="font-semibold">Puja más que el trono actual</p>
              <p className="text-sm text-neutral-500">Tu monto debe superar el monto que ves en "El trono actual", aunque sea por un centavo.</p>
            </div>
            <div className="bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">03</p>
              <p className="font-semibold">Paga de forma segura</p>
              <p className="text-sm text-neutral-500">El pago se procesa con Stripe. Tu puja solo cuenta si el cobro se confirma.</p>
            </div>
            <div className="bg-neutral-900 rounded-xl p-4 space-y-1">
              <p className="text-pink-400 font-mono text-sm">04</p>
              <p className="font-semibold">Tu grupo toma el #1</p>
              <p className="text-sm text-neutral-500">El puesto se actualiza al instante y se mantiene hasta que alguien más pague más.</p>
            </div>
          </div>
        </section>

        {/* Total recaudado + mensaje de caridad */}
        <div className="text-center py-2">
          <p className="text-sm text-neutral-400">Este proyecto ha recaudado</p>
          <p className="text-4xl sm:text-5xl font-black text-amber-400 font-mono drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            ${((totalRaised?.total_cents ?? 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-pink-400 mt-2">🎗️ El 5% de cada puja se dona a fundaciones caritativas</p>
        </div>

        {/* Actividad en vivo — oculta en lg+ porque ahí ya está el sidebar de donadores mostrando lo mismo */}
        <div className="lg:hidden">
          <ActivityFeed initialItems={feed ?? []} />
        </div>

        {/* FAQ */}
        <section id="faq" className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">❓ FAQ</h2>
          <div className="divide-y divide-neutral-900 bg-neutral-950 rounded-xl overflow-hidden">
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
              <p className="text-sm text-neutral-500">Gana la puja individual más alta de todo el historial. No se suman pujas anteriores del mismo grupo.</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-semibold text-sm">Represento a un grupo, ¿puedo reclamar su perfil?</p>
              <p className="text-sm text-neutral-500">Estamos preparando ese flujo de verificación. Mientras tanto, contáctanos directamente.</p>
            </div>
          </div>
        </section>

        {/* Formulario de puja */}
        <BidForm groups={groups ?? []} currentThroneCents={throneCents} />

        {/* Footer de confianza */}
        <footer className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-neutral-500 pt-6 border-t border-neutral-900">
          <div>
            <p className="text-xl mb-1">🛡️</p>
            <p className="font-semibold text-neutral-300">PAGO SEGURO</p>
            <p>Tus transacciones están protegidas y encriptadas.</p>
          </div>
          <div>
            <p className="text-xl mb-1">⚡</p>
            <p className="font-semibold text-neutral-300">SIN RESETS</p>
            <p>El #1 se mantiene hasta que alguien pague más.</p>
          </div>
          <div>
            <p className="text-xl mb-1">🏆</p>
            <p className="font-semibold text-neutral-300">UN SOLO TRONO</p>
            <p>No hay categorías. Solo uno puede reinar.</p>
          </div>
          <div>
            <p className="text-xl mb-1">🤝</p>
            <p className="font-semibold text-neutral-300">EL PODER ES DE LOS FANS</p>
            <p>Tú decides quién reina en el mundo del K-pop.</p>
          </div>
        </footer>

        {/* Links legales, estilo outbid.lol */}
        <div className="text-center text-xs text-neutral-600 pb-4">
          <a href="#" className="hover:text-pink-400">Reglas</a>
          <span className="mx-2">·</span>
          <a href="#" className="hover:text-pink-400">Términos</a>
          <span className="mx-2">·</span>
          <a href="#" className="hover:text-pink-400">Privacidad</a>
          <span className="mx-2">·</span>
          <a href="#" className="hover:text-pink-400">Estadísticas en vivo</a>
        </div>
      </div>
    </main>
  );
}
