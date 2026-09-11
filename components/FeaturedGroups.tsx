'use client';

import Link from 'next/link';
import { Mic2, Star } from 'lucide-react';
import GroupFollowButton from './GroupFollowButton';
import { useLiveRankings } from '@/lib/useLiveRankings';
import type { RankingRow } from '@/lib/types';

const FEATURED_COUNT = 4;

// "Grupos destacados": los primeros del Ranking Global, en tarjetas
// horizontales con su país real (groups.country) — nada de un "score"
// inventado, solo los puntos que ya tiene cada grupo este mes.
export default function FeaturedGroups({ initialRankings }: { initialRankings: RankingRow[] }) {
  const rankings = useLiveRankings(initialRankings);
  const featured = rankings.slice(0, FEATURED_COUNT);

  if (featured.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-pink-500 fill-pink-500" /> Grupos Destacados
        </h2>
        <Link href="/grupos" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {featured.map((group) => (
          <div key={group.group_id} className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden">
            <Link href={`/grupo/${group.slug}`} className="relative block aspect-square bg-neutral-100 dark:bg-neutral-900">
              {group.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Mic2 className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                </div>
              )}
            </Link>
            <div className="p-2.5 flex items-center justify-between gap-1">
              <div className="min-w-0">
                <Link href={`/grupo/${group.slug}`} className="font-bold text-sm truncate block hover:text-violet-600 dark:hover:text-violet-400 transition">
                  {group.group_name}
                </Link>
                <p className="text-[11px] text-neutral-500 truncate">{group.country ?? `${group.total_points.toLocaleString('es-MX')} pts`}</p>
              </div>
              <GroupFollowButton groupId={group.group_id} iconOnly />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
