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
    // El user_metadata viaja con la sesión guardada en localStorage, así que
    // getSession() lo entrega al instante sin esperar red — a diferencia de
    // la tabla `profiles`, que sí requiere una consulta. Usarlo como primera
    // fuente evita el parpadeo animalito-por-defecto -> foto real al recargar.
    function fromMetadata(meta: Record<string, unknown> | undefined): AvatarEntry {
      return {
        avatarSpecies: (meta?.avatar_species as string | null) ?? null,
        avatarUrl: (meta?.avatar_url as string | null) ?? null,
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setUserId(user?.id ?? null);
      if (user) setEntry(fromMetadata(user.user_metadata));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user) setEntry(fromMetadata(session.user.user_metadata));
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

    // Sincroniza en segundo plano por si `profiles` cambió desde otro
    // dispositivo o el user_metadata todavía no se había respaldado.
    supabase
      .from('profiles')
      .select('avatar_species, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const next: AvatarEntry = { avatarSpecies: data.avatar_species ?? null, avatarUrl: data.avatar_url ?? null };
        avatarCache[userId] = next;
        setEntry((prev) =>
          prev.avatarSpecies === next.avatarSpecies && prev.avatarUrl === next.avatarUrl ? prev : next
        );
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
