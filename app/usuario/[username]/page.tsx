import { notFound } from 'next/navigation';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import UserProfileFeed from '@/components/UserProfileFeed';

export const revalidate = 0;

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props) {
  const title = `@${params.username}`;
  return {
    title,
    description: `Publicaciones de @${params.username} en la Comunidad de K-pop Wars.`,
    alternates: { canonical: `/usuario/${params.username}` },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <LegalPage title={`@${profile.username}`} subtitle="Perfil de la Comunidad">
      <UserProfileFeed userId={profile.id} username={profile.username!} />
    </LegalPage>
  );
}
