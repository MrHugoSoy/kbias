import Link from 'next/link';
import { Mic2 } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Estadísticas — El Trono',
};

export const revalidate = 0;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 text-center">
      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{value}</p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

export default async function EstadisticasPage() {
  const supabase = getSupabasePublicClient();

  const { data: totalRaised } = await supabase.from('total_raised').select('*').maybeSingle();
  const { data: siteStats } = await supabase.from('site_stats').select('*').maybeSingle();
  const { count: bidCount } = await supabase
    .from('bids')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'succeeded');
  const { data: rankings } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_donated_cents', { ascending: false });

  const groupsWithDonations = (rankings ?? []).filter((r) => r.total_donated_cents > 0).length;

  return (
    <LegalPage title="Estadísticas en vivo" subtitle="Los números reales detrás de El Trono, actualizados al cargar la página." wide>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Recaudado en total"
          value={`$${((totalRaised?.total_cents ?? 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        />
        <StatCard label="Pujas exitosas" value={(bidCount ?? 0).toLocaleString('es-MX')} />
        <StatCard label="Grupos con donaciones" value={groupsWithDonations.toLocaleString('es-MX')} />
        <StatCard label="Visitas desde el lanzamiento" value={(siteStats?.total_visits ?? 0).toLocaleString('es-MX')} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400">Ranking completo</h2>
        {(rankings ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay grupos registrados.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
            {(rankings ?? []).map((r, i) => (
              <div key={r.group_id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="text-neutral-500 font-mono w-8 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 relative transition-transform duration-200 hover:scale-125 hover:z-10">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                  ) : (
                    <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{r.group_name}</p>
                  <p className="text-xs text-pink-400 truncate">{r.fandom_name}</p>
                </div>
                <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0">
                  ${(r.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-600">
        ¿Quieres ver el podio en vivo? Vuelve al{' '}
        <Link href="/#ranking" className="underline hover:text-pink-500 dark:hover:text-pink-400">
          ranking principal
        </Link>
        .
      </p>
    </LegalPage>
  );
}
