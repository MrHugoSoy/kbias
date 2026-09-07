'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { notifyFollowsChanged } from '@/lib/followEvents';
import AuthModal from './AuthModal';

// Botón para seguir/dejar de seguir un grupo desde su página. El contador
// de seguidores y el estado "¿ya lo sigo?" se leen directo con el cliente
// anon (group_follows tiene policy de select pública) — solo escribir pasa
// por /api/community/group-follows, que verifica el token real de sesión.
export default function GroupFollowButton({ groupId }: { groupId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .from('group_follows')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .then(({ count }) => setFollowerCount(count ?? 0));
  }, [groupId]);

  useEffect(() => {
    if (!userId) {
      setFollowing(false);
      return;
    }
    supabase
      .from('group_follows')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [userId, groupId]);

  async function toggle() {
    if (!userId) {
      setShowAuth(true);
      return;
    }
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => Math.max(0, (c ?? 0) + (wasFollowing ? -1 : 1)));
    setLoading(true);
    try {
      const res = await authFetch('/api/community/group-follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowerCount(data.followerCount);
        notifyFollowsChanged();
        return;
      }
    } catch {
      // sigue al revert de abajo
    } finally {
      setLoading(false);
    }
    setFollowing(wasFollowing);
    setFollowerCount((c) => Math.max(0, (c ?? 0) + (wasFollowing ? 1 : -1)));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={
          'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition disabled:opacity-50 ' +
          (following
            ? 'bg-black/40 backdrop-blur-sm text-white hover:bg-red-500/70'
            : 'bg-white text-violet-700 hover:opacity-90')
        }
      >
        <Heart className={'w-3.5 h-3.5' + (following ? ' fill-current' : '')} />
        {following ? 'Siguiendo' : 'Seguir'}
      </button>
      {followerCount !== null && (
        <span className="text-xs text-white/80">
          {followerCount.toLocaleString('es-MX')} {followerCount === 1 ? 'seguidor' : 'seguidores'}
        </span>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
    </div>
  );
}
