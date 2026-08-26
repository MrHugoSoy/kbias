import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import ClaimForm from '@/components/ClaimForm';

export const metadata = {
  title: 'Reclamar perfil — El Trono',
};

export const revalidate = 0;

export default async function ReclamarPage() {
  const supabase = getSupabasePublicClient();
  const { data: groups } = await supabase.from('groups').select('id, name, fandom_name').order('name');

  return (
    <LegalPage
      title="Reclamar el perfil de un grupo"
      subtitle="¿Representas a un grupo o su management? Cuéntanos y lo revisamos a mano."
    >
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        No hay verificación automática — alguien de nuestro equipo revisa cada solicitud manualmente contra el link
        de verificación que dejes (cuenta oficial, sitio de la agencia, etc.) antes de aprobarla.
      </p>
      <ClaimForm groups={groups ?? []} />
    </LegalPage>
  );
}
