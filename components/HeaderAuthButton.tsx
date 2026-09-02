'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

// Botón "Iniciar sesión" del header — solo se muestra sin sesión (con
// sesión ya está el ícono de perfil). Reutiliza el AuthModal existente en
// vez de duplicar el formulario de login.
export default function HeaderAuthButton() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (userId === undefined || userId) return null;

  return (
    <>
      <button
        onClick={() => setShowAuth(true)}
        className="shrink-0 bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-full transition"
      >
        Iniciar sesión
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
    </>
  );
}
