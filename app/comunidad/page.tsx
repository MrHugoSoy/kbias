import { LegalPage } from '@/components/LegalPage';
import CommunityFeed from '@/components/CommunityFeed';

export const metadata = {
  title: 'Comunidad',
  description: 'Comparte tu opinión con otros fans del K-pop.',
};

export default function ComunidadPage() {
  return (
    <LegalPage title="Comunidad" subtitle="Comparte tu opinión con otros fans del K-pop.">
      <CommunityFeed />
    </LegalPage>
  );
}
