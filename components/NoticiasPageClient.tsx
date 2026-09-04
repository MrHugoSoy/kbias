'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, Mic2, Newspaper, Star, Tag, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';
import type { NewsPost } from '@/lib/types';

const PAGE_SIZE = 5;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'Hace unos minutos';
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
      {category}
    </span>
  );
}

function PostImage({ post }: { post: NewsPost }) {
  return (
    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <Mic2 className="w-8 h-8 text-neutral-400 dark:text-neutral-700" />
      )}
    </div>
  );
}

function FeaturedCard({ post }: { post: NewsPost }) {
  return (
    <Link href={`/noticias/${post.id}`} className="group block rounded-2xl overflow-hidden bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10">
      <div className="relative h-36">
        <PostImage post={post} />
        <CategoryBadge category={post.category} />
      </div>
      <div className="p-4 space-y-1.5">
        <p className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{post.title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.body}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-600">{timeAgo(post.published_at)}</p>
      </div>
    </Link>
  );
}

function NewsRow({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/noticias/${post.id}`}
      className="group flex gap-4 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden p-3"
    >
      <div className="relative w-32 sm:w-40 shrink-0 rounded-xl overflow-hidden">
        <PostImage post={post} />
        <CategoryBadge category={post.category} />
      </div>
      <div className="flex-1 min-w-0 py-1 space-y-1.5">
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
        <p className="font-bold leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{post.title}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.body}</p>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1">
            Leer más <ArrowRight className="w-3 h-3" />
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-600">{timeAgo(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function NoticiasPageClient({ posts }: { posts: NewsPost[] }) {
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'recent' | 'old'>('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filtered = useMemo(() => {
    let rows = category === 'all' ? posts : posts.filter((p) => p.category === category);
    rows = [...rows].sort((a, b) => {
      const diff = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
      return sort === 'recent' ? -diff : diff;
    });
    return rows;
  }, [posts, category, sort]);

  const visible = filtered.slice(0, visibleCount);
  const featured = posts[0] ?? null;

  function changeCategory(next: string) {
    setCategory(next);
    setVisibleCount(PAGE_SIZE);
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Newspaper className="w-12 h-12 mx-auto text-violet-500" />
        <p className="text-neutral-500 dark:text-neutral-400">Todavía no hay noticias publicadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pestañas de categoría */}
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-1.5 flex flex-wrap gap-1 text-sm font-bold">
        <button
          onClick={() => changeCategory('all')}
          className={
            'flex-1 min-w-[6rem] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition ' +
            (category === 'all' ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white' : 'text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400')
          }
        >
          <Layers className="w-4 h-4" /> Todas
        </button>
        {categories.map(([name]) => (
          <button
            key={name}
            onClick={() => changeCategory(name)}
            className={
              'flex-1 min-w-[6rem] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition ' +
              (category === name ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white' : 'text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400')
            }
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
        {/* Barra lateral */}
        <div className="space-y-4">
          {featured && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Noticia destacada
              </h3>
              <FeaturedCard post={featured} />
            </div>
          )}

          <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-500" /> Categorías
            </h3>
            <button
              onClick={() => changeCategory('all')}
              className={
                'w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ' +
                (category === 'all' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900')
              }
            >
              Todas <span>{posts.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                onClick={() => changeCategory(name)}
                className={
                  'w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ' +
                  (category === name ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900')
                }
              >
                {name} <span>{count}</span>
              </button>
            ))}
          </div>

          {userId === null && (
            <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-2xl p-4 text-white space-y-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Únete a la comunidad
              </h3>
              <p className="text-xs text-white/90">Crea tu cuenta gratis para votar, comentar y apoyar a tu grupo favorito.</p>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-white text-violet-600 text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </div>

        {/* Últimas noticias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-violet-500" /> Últimas noticias
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              <option value="recent">Más recientes</option>
              <option value="old">Más antiguas</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">No hay noticias en esta categoría todavía.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((post) => (
                <NewsRow key={post.id} post={post} />
              ))}
            </div>
          )}

          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="w-full text-sm font-bold text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
            >
              Cargar más noticias
            </button>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
    </div>
  );
}
