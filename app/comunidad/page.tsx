import { LegalPage } from '@/components/LegalPage';
import CommunityFeed from '@/components/CommunityFeed';
import CommunitySidebar from '@/components/CommunitySidebar';

export const metadata = {
  title: 'Comunidad',
  description: 'Comparte tu opinión con otros fans del K-pop.',
};

export default function ComunidadPage() {
  return (
    <LegalPage title="Comunidad" subtitle="Comparte tu opinión con otros fans del K-pop." wide>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <CommunitySidebar />
        <CommunityFeed />
      </div>
    </LegalPage>
  );
}
