'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PixelAvatar from './PixelAvatar';
import { User } from 'lucide-react';

type AvatarEntry = { avatarSpecies: string | null; avatarUrl: string | null };

// Cache por sesión de navegador: evita repetir la consulta a `profiles`
// cada vez que este ícono se monta (header desktop + menú hamburguesa).
const avatarCache: Record<string, AvatarEntry> = {};

export default function ProfileAvatarIcon({ size = 32 }: { size?: number }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [entry, setEntry] = useState<AvatarEntry>({ avatarSpecies: null, avatarUrl: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setEntry({ avatarSpecies: null, avatarUrl: null });
      return;
    }
    const cached = avatarCache[userId];
    if (cached) setEntry(cached);

    supabase
      .from('profiles')
      .select('avatar_species, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const next: AvatarEntry = { avatarSpecies: data?.avatar_species ?? null, avatarUrl: data?.avatar_url ?? null };
        avatarCache[userId] = next;
        setEntry(next);
      });
  }, [userId]);

  if (!userId) {
    return (
      <span
        className="rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <User style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }

  if (entry.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entry.avatarUrl}
        alt="Mi perfil"
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return <PixelAvatar seed={userId} species={entry.avatarSpecies} size={size} />;
}
