import { LegalPage } from '@/components/LegalPage';
import BattlesPageClient from '@/components/BattlesPageClient';

export const metadata = {
  title: 'Batallas',
  description: 'Enfrentamos a los grupos más increíbles del K-pop. Vota por tu favorito y llévalo a la victoria.',
};

export default function BatallasPage() {
  return (
    <LegalPage title="Batallas" subtitle="Enfrentamos a los grupos más increíbles del K-pop. ¡Vota por tu favorito y llévalo a la victoria!" wide>
      <BattlesPageClient />
    </LegalPage>
  );
}
