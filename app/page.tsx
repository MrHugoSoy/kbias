import { getSupabasePublicClient } from '@/lib/supabase';
import BidButton from '@/components/BidButton';
import ActivityFeed from '@/components/ActivityFeed';
import BidForm from '@/components/BidForm';

export const revalidate = 0; // siempre datos frescos, el ranking cambia en cualquier momento

export default async function Home() {
  const supabase = getSupabasePublicClient();

  const { data: throne } = await supabase.from('current_throne').select('*').maybeSingle();
  const { data: feed } = await supabase.from('activity_feed').select('*');
  const { data: groups } = await supabase.from('groups').select('*').order('name');

  // Mayor donador (no anónimo) del grupo que tiene el trono ahora mismo.
  const { data: topDonor } = throne
    ? await supabase
        .from('top_donor_per_group')
        .select('*')
        .eq('group_id', throne.group_id)
        .maybeSingle()
    : { data: null };

  const throneCents = throne?.amount_cents ?? 0;
  // Grupos que no están en el trono, ordenados por qué tan cerca están de tomarlo
  const competitors = (groups ?? []).filter((g) => g.id !== throne?.group_id);

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 max-w-5xl mx-auto">
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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Trono actual */}
        <section className="relative">
          <div className="absolute inset-0 bg-pink-600/10 blur-3xl rounded-full" />
          {throne ? (
            <div className="relative border-2 border-pink-600 rounded-2xl p-8 text-center space-y-3 bg-gradient-to-b from-pink-950/30 to-black">
              <div className="text-5xl">👑</div>
              <p className="text-xs tracking-[0.3em] text-pink-400 font-semibold">✦ EL TRONO ACTUAL ✦</p>
              <div className="w-40 h-40 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-800 flex items-center justify-center overflow-hidden">
                {throne.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={throne.image_url} alt={throne.group_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🎤</span>
                )}
              </div>
              <h2 className="text-4xl font-black tracking-tight">{throne.group_name}</h2>
              {throne.fandom_name && (
                <p className="text-pink-400 font-semibold">♥ {throne.fandom_name} ♥</p>
              )}
              <p className="text-xs text-neutral-500 tracking-widest uppercase pt-2">Monto actual</p>
              <p className="text-5xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono">
                ${(throne.amount_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-neutral-500">
                reclamado por {throne.is_anonymous ? 'un fan anónimo 🎭' : throne.supporter_name || 'un fan'}
              </p>
              {topDonor?.supporter_name && (
                <p className="text-xs text-neutral-600">
                  Mayor fan: <span className="text-pink-300 font-semibold">{topDonor.supporter_name}</span> — $
                  {(topDonor.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          ) : (
            <div className="relative border-2 border-pink-600 rounded-2xl p-10 text-center">
              <p className="text-xl">El trono está vacío. ¡Sé el primero en reclamarlo!</p>
            </div>
          )}
        </section>

        {/* Grupos competidores */}
        <section id="ranking" className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-bold flex items-center gap-2">👑 GRUPOS COMPETIDORES</h2>
            <span className="text-xs text-neutral-500">¡Tú puedes tomar el trono!</span>
          </div>
          <div className="space-y-2">
            {/*
              La puja mínima para tomar el trono es SIEMPRE throneCents + $0.01,
              sin importar cuánto haya pagado antes cada grupo (current_throne y
              /api/bid comparan contra el monto más alto histórico, no contra
              una suma acumulada por grupo). Por eso la diferencia es la misma
              para todos los competidores.
            */}
            {competitors.map((group) => (
              <div key={group.id} className="flex items-center justify-between bg-neutral-900 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
                    {group.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>🎤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{group.name}</p>
                    <p className="text-xs text-pink-400">{group.fandom_name}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Diferencia con el trono</p>
                  <p className="text-pink-400 font-mono text-sm">
                    {throneCents > 0
                      ? `-$${(throneCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                      : '¡Sé el primero!'}
                  </p>
                </div>
                <BidButton groupId={group.id} groupName={group.name} currentThroneCents={throneCents} />
              </div>
            ))}
          </div>
        </section>

        {/* Actividad en vivo */}
        <ActivityFeed initialItems={feed ?? []} />

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
      </div>
    </main>
  );
}
