'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import PixelAvatar from './PixelAvatar';
import AuthModal from './AuthModal';

const COMMENT_MAX_LENGTH = 500;

type Comment = {
  id: string;
  group_id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_species: string | null;
  avatar_url: string | null;
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `Hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function GroupComments({ groupId, initialComments }: { groupId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`group-comments-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_comments', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const row = payload.new as { id: string; group_id: string; body: string; created_at: string; user_id: string };
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              { ...row, username: null, avatar_species: null, avatar_url: null },
              ...prev,
            ];
          });
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_species, avatar_url')
            .eq('id', row.user_id)
            .maybeSingle();
          if (profile) {
            setComments((prev) => prev.map((c) => (c.id === row.id ? { ...c, ...profile } : c)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function handleSubmit() {
    setError('');
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Escribe un comentario');
      return;
    }
    setPosting(true);
    try {
      const res = await authFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Algo salió mal');
        return;
      }
      setComments((prev) => (prev.some((c) => c.id === data.comment.id) ? prev : [data.comment, ...prev]));
      setBody('');
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setPosting(false);
    }
  }

  async function handlePostClick() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setShowAuth(true);
      return;
    }
    handleSubmit();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-pink-500" /> Foro de discusión
      </h2>

      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
          placeholder={userId ? 'Comparte tu opinión sobre este grupo...' : 'Inicia sesión para comentar'}
          rows={3}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-500">
            {body.length}/{COMMENT_MAX_LENGTH}
          </p>
          <button
            onClick={handlePostClick}
            disabled={posting}
            className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {posting ? 'Publicando...' : 'Comentar'}
          </button>
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
        {comments.length === 0 && (
          <p className="text-center text-neutral-500 py-6 text-sm">Sin comentarios todavía — ¡sé el primero!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="px-4 py-3 flex gap-3">
            {c.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <PixelAvatar seed={c.user_id} species={c.avatar_species} size={32} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{c.username ? `@${c.username}` : 'Un fan'}</span>
                <span className="text-[10px] text-neutral-500" suppressHydrationWarning>
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 text-pretty break-words">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={() => {
            setShowAuth(false);
            handleSubmit();
          }}
        />
      )}
    </section>
  );
}
