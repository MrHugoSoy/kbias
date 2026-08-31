import Link from 'next/link';
import { Crown, Mic2 } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Salón de la Fama',
  description: 'Los grupos que se quedaron con el #1 en cada mes de K-pop Wars, mes a mes.',
};

export const revalidate = 0;

type MonthlyRow = {
  month_start: string;
  group_id: string;
  group_name: string;
  fandom_name: string | null;
  image_url: string | null;
  slug: string;
  total_points: number;
  rank: number;
};

export default async function SalonDeLaFamaPage() {
  const supabase = getSupabasePublicClient();

  // month_start es una fecha (no timestamptz) — se compara como texto
  // 'YYYY-MM-DD' del primer día del mes actual en UTC.
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from('monthly_rankings')
    .select('*')
    .lt('month_start', currentMonthStart)
    .lte('rank', 3)
    .order('month_start', { ascending: false })
    .order('rank', { ascending: true });

  const months = new Map<string, MonthlyRow[]>();
  for (const row of (rows ?? []) as MonthlyRow[]) {
    if (!months.has(row.month_start)) months.set(row.month_start, []);
    months.get(row.month_start)!.push(row);
  }

  return (
    <LegalPage
      title="Salón de la Fama"
      subtitle="El #1 de cada mes queda registrado aquí para siempre — el ranking en vivo se reinicia, esto no."
      wide
    >
      {months.size === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Crown className="w-12 h-12 mx-auto text-pink-500" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Todavía no hay meses cerrados — el primer campeón del Salón de la Fama se corona cuando termine el mes
            en curso.
          </p>
          <Link href="/#ranking" className="text-sm underline hover:text-pink-500 dark:hover:text-pink-400">
            Ver el ranking en vivo
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(months.entries()).map(([monthStart, monthRows]) => {
            const rawLabel = new Date(`${monthStart}T00:00:00Z`).toLocaleDateString('es-MX', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            });
            const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
            const champions = monthRows.filter((r) => r.rank === 1);
            const runnersUp = monthRows.filter((r) => r.rank > 1);

            return (
              <section key={monthStart} className="space-y-3">
                <h2 className="text-sm font-bold text-pink-500 dark:text-pink-400 tracking-widest">{label}</h2>

                <div className="space-y-2">
                  {champions.map((r) => (
                    <Link
                      key={r.group_id}
                      href={`/grupo/${r.slug}`}
                      className="flex items-center gap-4 rounded-2xl border-2 border-pink-600 bg-gradient-to-r from-pink-100 to-white dark:from-pink-950/30 dark:to-black p-4 hover:border-pink-500 transition"
                    >
                      <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                      <div className="w-14 h-14 rounded-full border-2 border-pink-500 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                        ) : (
                          <Mic2 className="w-6 h-6 text-neutral-500 dark:text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg truncate">{r.group_name}</p>
                        {r.fandom_name && <p className="text-xs text-pink-400 truncate">{r.fandom_name}</p>}
                      </div>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold shrink-0">
                        {r.total_points.toLocaleString('es-MX')} {r.total_points === 1 ? 'voto' : 'votos'}
                      </span>
                    </Link>
                  ))}

                  {runnersUp.map((r) => (
                    <Link
                      key={r.group_id}
                      href={`/grupo/${r.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-3 hover:border-pink-400 transition"
                    >
                      <span className="text-neutral-500 font-mono text-sm w-6 text-center shrink-0">#{r.rank}</span>
                      <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt={r.group_name} className="w-full h-full object-cover" />
                        ) : (
                          <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.group_name}</p>
                      </div>
                      <span className="font-mono text-sm text-neutral-500 shrink-0">
                        {r.total_points.toLocaleString('es-MX')} {r.total_points === 1 ? 'voto' : 'votos'}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </LegalPage>
  );
}
