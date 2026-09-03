import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mic2 } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import type { NewsPost } from '@/lib/types';

export const revalidate = 0;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data } = await supabase.from('news_posts').select('title, body').eq('id', params.id).maybeSingle();
  if (!data) return { title: 'Noticia' };
  return { title: data.title, description: data.body.slice(0, 160) };
}

export default async function NoticiaPage({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data } = await supabase
    .from('news_posts')
    .select('id, title, body, cover_url, category, published_at, group:groups(name, slug, image_url)')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();
  const post = data as unknown as NewsPost;

  return (
    <LegalPage title={post.title} subtitle={new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}>
      <div className="space-y-4">
        {post.cover_url && (
          <div className="rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_url} alt="" className="w-full h-56 sm:h-72 object-cover" />
          </div>
        )}

        {post.group && (
          <Link
            href={`/grupo/${post.group.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
              {post.group.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.group.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Mic2 className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </span>
            {post.group.name}
          </Link>
        )}

        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">{post.body}</p>

        <Link href="/noticias" className="inline-block text-sm text-violet-600 dark:text-violet-400 hover:underline">
          ← Ver todas las noticias
        </Link>
      </div>
    </LegalPage>
  );
}
