import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import NoticiasPageClient from '@/components/NoticiasPageClient';
import type { NewsPost } from '@/lib/types';

export const metadata = {
  title: 'Noticias',
  description: 'Novedades de K-pop Wars y de los grupos en el ranking.',
};

export const revalidate = 0;

export default async function NoticiasPage() {
  const supabase = getSupabasePublicClient();
  const { data } = await supabase
    .from('news_posts')
    .select('id, title, body, cover_url, category, published_at, group:groups(name, slug, image_url)')
    .order('published_at', { ascending: false });

  const posts = (data ?? []) as unknown as NewsPost[];

  return (
    <LegalPage title="Noticias K-pop" subtitle="Mantente al día con todo lo que sucede en el mundo del K-pop." wide>
      <NoticiasPageClient posts={posts} />
    </LegalPage>
  );
}
