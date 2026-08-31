'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PixelAvatar from './PixelAvatar';
import { User } from 'lucide-react';

type AvatarEntry = { avatarSpecies: string | null; avatarUrl: string | null };

// Cache por sesión de navegador: evita repetir la consulta a `profiles`
// cada vez que este ícono se monta (header desktop + menú hamburguesa).
const avatarCache: Record<string, AvatarEntry> = {};

function fromMetadata(meta: Record<string, unknown> | undefined): AvatarEntry {
  return {
    avatarSpecies: (meta?.avatar_species as string | null) ?? null,
    avatarUrl: (meta?.avatar_url as string | null) ?? null,
  };
}

function hasMetadataAvatar(meta: Record<string, unknown> | undefined): boolean {
  return !!(meta?.avatar_species || meta?.avatar_url);
}

export default function ProfileAvatarIcon({ size = 32 }: { size?: number }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [entry, setEntry] = useState<AvatarEntry>({ avatarSpecies: null, avatarUrl: null });
  // Sigue en null (esqueleto) hasta que tengamos una respuesta de fiar:
  // el user_metadata ya trae avatar, o no hay sesión, o ya llegó la
  // consulta a `profiles`. Así evitamos mostrar un ícono "de paso"
  // (genérico o animalito por defecto) que luego cambia a la foto real.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // El user_metadata viaja con la sesión guardada en localStorage, así que
    // getSession() lo entrega al instante sin esperar red — a diferencia de
    // la tabla `profiles`, que sí requiere una consulta.
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setUserId(user?.id ?? null);
      if (user) {
        setEntry(fromMetadata(user.user_metadata));
        if (hasMetadataAvatar(user.user_metadata)) setReady(true);
      } else {
        setReady(true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        setEntry(fromMetadata(session.user.user_metadata));
        if (hasMetadataAvatar(session.user.user_metadata)) setReady(true);
      } else {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setEntry({ avatarSpecies: null, avatarUrl: null });
      return;
    }
    const cached = avatarCache[userId];
    if (cached) {
      setEntry(cached);
      setReady(true);
      return;
    }

    // Si el user_metadata todavía no tenía avatar (cuenta que no ha vuelto
    // a abrir /perfil desde que se agregó ese respaldo), consulta `profiles`
    // y solo entonces se marca listo — mostrando el esqueleto mientras tanto
    // en vez de un animalito por defecto que luego cambia.
    supabase
      .from('profiles')
      .select('avatar_species, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const next: AvatarEntry = { avatarSpecies: data?.avatar_species ?? null, avatarUrl: data?.avatar_url ?? null };
        avatarCache[userId] = next;
        setEntry((prev) =>
          prev.avatarSpecies === next.avatarSpecies && prev.avatarUrl === next.avatarUrl ? prev : next
        );
        setReady(true);
      });
  }, [userId]);

  if (!ready) {
    return (
      <span
        className="rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

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
