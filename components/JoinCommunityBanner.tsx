'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

// Banner promocional para quien todavía no tiene cuenta — se oculta solo
// para quien ya inició sesión, en vez de invitar a "unirse" a alguien que
// ya es parte de la comunidad.
export default function JoinCommunityBanner() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (userId) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[10rem] flex items-center justify-center text-center p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fondohero.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative space-y-3">
        <p className="text-white font-bold text-lg italic" style={{ fontFamily: 'Georgia, serif' }}>
          Más que música,
          <br />
          una comunidad global
        </p>
        <button
          onClick={() => setShowAuth(true)}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-sm px-5 py-2.5 rounded-full transition"
        >
          Únete ahora →
        </button>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
    </div>
  );
}
