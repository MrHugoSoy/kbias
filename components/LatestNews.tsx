import Link from 'next/link';
import { Star, ArrowRight, Mic2 } from 'lucide-react';
import type { NewsPost } from '@/lib/types';

// "Hace X horas/días" — igual de simple que el de ActivityFeed pero en
// formato largo, como pide el diseño de esta tarjeta.
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'Hace unos minutos';
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

function CategoryBadge({ post }: { post: NewsPost }) {
  const label = post.category || post.group?.name;
  if (!label) return null;
  return (
    <span className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}

function FeaturedCard({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/noticias/${post.id}`}
      className="group relative block rounded-2xl overflow-hidden h-64 sm:h-full min-h-[16rem] bg-neutral-200 dark:bg-neutral-900"
    >
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Mic2 className="w-10 h-10 text-neutral-400 dark:text-neutral-700" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <CategoryBadge post={post} />
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1.5">
        <p className="text-white font-black text-lg leading-snug line-clamp-2">{post.title}</p>
        <p className="text-white/80 text-sm line-clamp-2">{post.body}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-white inline-flex items-center gap-1">
            Leer más <ArrowRight className="w-3 h-3" />
          </span>
          <span className="text-xs text-white/70">{timeAgo(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function StandardCard({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/noticias/${post.id}`}
      className="block bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl overflow-hidden hover:border-violet-300 dark:hover:border-violet-800 transition"
    >
      <div className="relative h-32 bg-neutral-100 dark:bg-neutral-900">
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <CategoryBadge post={post} />
      </div>
      <div className="p-4 space-y-1.5">
        <p className="font-bold text-sm leading-snug line-clamp-2">{post.title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.body}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1">
            Leer más <ArrowRight className="w-3 h-3" />
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-600">{timeAgo(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

// Vista previa de las últimas noticias en la portada — mismo patrón que
// Ranking Global y Batallas de Canciones (una muestra + link a la página
// completa). Se oculta por completo si no hay ninguna publicada, igual que
// SongBattles con cero canciones cargadas.
export default function LatestNews({ posts }: { posts: NewsPost[] }) {
  if (posts.length === 0) return null;
  const [featured, ...rest] = posts;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
          <Star className="w-5 h-5 text-violet-500 fill-violet-500" /> Últimas noticias
        </h2>
        <Link
          href="/noticias"
          className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
        >
          Ver todas <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-[2fr_1fr_1fr] gap-4 items-stretch">
        <FeaturedCard post={featured} />
        {rest.map((post) => (
          <StandardCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
