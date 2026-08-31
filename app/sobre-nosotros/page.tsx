import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata = {
  title: 'Sobre nosotros',
  description: 'Por qué existe K-pop Wars y qué tan lejos ha llegado hasta ahora, con números en vivo.',
};

export const revalidate = 0;

export default async function SobreNosotrosPage() {
  const supabase = getSupabasePublicClient();
  const { count: voteCount } = await supabase.from('votes').select('id', { count: 'exact', head: true });
  const { data: siteStats } = await supabase.from('site_stats').select('*').maybeSingle();
  const { count: groupCount } = await supabase.from('groups').select('id', { count: 'exact', head: true });

  return (
    <LegalPage
      title="Sobre nosotros"
      subtitle="Por qué existe K-pop Wars y qué tan lejos ha llegado hasta ahora."
    >
      <LegalSection title="La idea">
        <p>
          K-pop Wars nació de una pregunta simple: ¿qué pasaría si, en vez de discutir en redes sobre qué fandom apoya
          más a su grupo, cada quien pudiera demostrarlo con hechos?
        </p>
        <p>
          Aquí no hay categorías. Hay un solo trono cada mes, y lo tiene el grupo con más votos en ese mes calendario
          — el ranking se reinicia el día 1 de cada mes, y los campeones anteriores quedan en el Salón de la Fama.
          Votar es gratis — solo necesitas una cuenta, un voto cada 24 horas, y eso es lo único que decide quién manda.
        </p>
      </LegalSection>

      <LegalSection title="Números en tiempo real">
        <p>Esto no son cifras de marketing — son los mismos datos que ves en el ranking, en vivo:</p>
        <div className="grid grid-cols-3 gap-3 not-prose pt-2">
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {(voteCount ?? 0).toLocaleString('es-MX')}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">Votos</p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{groupCount ?? 0}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">Grupos</p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {(siteStats?.total_visits ?? 0).toLocaleString('es-MX')}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">Visitas</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Cómo lo construimos">
        <p>
          K-pop Wars es un proyecto chico, sin inversión ni equipo grande detrás — solo la idea de que el poder de
          decidir quién reina debería estar en manos de los fans, no de un algoritmo o un jurado.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
