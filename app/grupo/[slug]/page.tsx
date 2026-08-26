import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getSupabasePublicClient } from '@/lib/supabase';
import { LegalPage } from '@/components/LegalPage';
import BidButton from '@/components/BidButton';
import CopyLinkButton from '@/components/CopyLinkButton';

export const revalidate = 0;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data: group } = await supabase.from('groups').select('name').eq('slug', params.slug).maybeSingle();
  return { title: group ? `${group.name} — El Trono` : 'Grupo — El Trono' };
}

export default async function GroupDetailPage({ params }: Props) {
  const supabase = getSupabasePublicClient();
  const { data: rankings } = await supabase
    .from('group_rankings')
    .select('*')
    .order('total_donated_cents', { ascending: false });

  const list = rankings ?? [];
  const index = list.findIndex((r) => r.slug === params.slug);
  if (index === -1) notFound();

  const group = list[index];
  const rank = index + 1;
  const hasBids = group.total_donated_cents > 0;

  return (
    <LegalPage
      title={group.group_name}
      subtitle={group.fandom_name ? `♥ ${group.fandom_name} ♥` : `Puesto #${rank} de ${list.length}`}
    >
      <div className="border-2 border-pink-600 rounded-2xl p-8 text-center space-y-3 bg-gradient-to-b from-pink-100 to-white dark:from-pink-950/30 dark:to-black">
        <p className="text-xs tracking-[0.3em] text-pink-400 font-semibold">#{rank} DE {list.length}</p>
        <div className="w-32 h-32 mx-auto rounded-full border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.group_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">🎤</span>
          )}
        </div>
        <h2 className="text-3xl font-black tracking-tight">{group.group_name}</h2>
        {group.fandom_name && <p className="text-pink-400 font-semibold">♥ {group.fandom_name} ♥</p>}
        {group.bio && <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">{group.bio}</p>}

        <p className="text-xs text-neutral-500 tracking-widest uppercase pt-2">Total donado</p>
        <p className="text-5xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] font-mono">
          ${(group.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>

        {hasBids && (
          <p className="text-sm text-neutral-500">
            Para quitarle este puesto: más de $
            {(group.total_donated_cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} en total.
          </p>
        )}

        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          {group.official_url && (
            <a
              href={group.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400 hover:underline"
            >
              Visitar sitio oficial <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <CopyLinkButton slug={group.slug} />
        </div>

        <div className="pt-2">
          <BidButton groupId={group.group_id} groupName={group.group_name} />
        </div>
      </div>
    </LegalPage>
  );
}
