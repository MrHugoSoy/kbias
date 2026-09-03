import Link from 'next/link';
import { Newspaper, Mic2 } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
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
    <LegalPage title="Noticias" subtitle="Novedades de K-pop Wars y de los grupos del ranking." wide>
      {posts.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Newspaper className="w-12 h-12 mx-auto text-violet-500" />
          <p className="text-neutral-500 dark:text-neutral-400">Todavía no hay noticias publicadas.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/noticias/${post.id}`}
              className="block bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl overflow-hidden hover:border-violet-300 dark:hover:border-violet-800 transition"
            >
              <div className="h-36 bg-neutral-100 dark:bg-neutral-900">
                {post.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 space-y-2">
                {post.group && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                      {post.group.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.group.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Mic2 className="w-2.5 h-2.5 text-neutral-500" />
                      )}
                    </span>
                    {post.group.name}
                  </span>
                )}
                <h2 className="font-bold leading-tight">{post.title}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.body}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600">
                  {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </LegalPage>
  );
}
