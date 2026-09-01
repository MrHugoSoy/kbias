'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import UserAvatar from './UserAvatar';

type NotificationRow = {
  id: string;
  comment_id: string;
  group_id: string;
  group_name: string;
  group_slug: string;
  comment_body: string | null;
  read_at: string | null;
  created_at: string;
  actor_username: string | null;
  actor_avatar_species: string | null;
  actor_avatar_url: string | null;
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

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    authFetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications ?? []));

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as { id: string; comment_id: string; group_id: string; actor_id: string; created_at: string };
          const [{ data: group }, { data: comment }, { data: profile }] = await Promise.all([
            supabase.from('groups').select('name, slug').eq('id', row.group_id).single(),
            supabase.from('group_comments').select('body, parent_id').eq('id', row.comment_id).single(),
            supabase.from('profiles').select('username, avatar_species, avatar_url').eq('id', row.actor_id).maybeSingle(),
          ]);
          const notification: NotificationRow = {
            id: row.id,
            comment_id: row.comment_id,
            group_id: row.group_id,
            group_name: group?.name ?? 'Grupo desconocido',
            group_slug: group?.slug ?? '',
            comment_body: comment?.body ?? null,
            read_at: null,
            created_at: row.created_at,
            actor_username: profile?.username ?? null,
            actor_avatar_species: profile?.avatar_species ?? null,
            actor_avatar_url: profile?.avatar_url ?? null,
          };
          setNotifications((prev) => (prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await authFetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await authFetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  }

  if (!userId) return null;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        className="relative w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:opacity-80 transition"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-bold">Notificaciones</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-pink-500 hover:underline">
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-900">
              {notifications.length === 0 && (
                <p className="text-center text-neutral-500 text-sm py-6">Sin notificaciones todavía.</p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/grupo/${n.group_slug}#comment-${n.comment_id}`}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                  className={
                    'flex gap-2.5 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition' +
                    (n.read_at ? '' : ' bg-pink-50 dark:bg-pink-950/20')
                  }
                >
                  <UserAvatar
                    avatarUrl={n.actor_avatar_url}
                    seed={n.actor_username ?? n.id}
                    species={n.actor_avatar_species}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <strong>{n.actor_username ? `@${n.actor_username}` : 'Un fan'}</strong> respondió tu comentario en{' '}
                      <strong className="text-pink-600 dark:text-pink-400">{n.group_name}</strong>
                    </p>
                    {n.comment_body && (
                      <p className="text-xs text-neutral-500 truncate mt-0.5">"{n.comment_body}"</p>
                    )}
                    <p className="text-[10px] text-neutral-500 mt-0.5" suppressHydrationWarning>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-1" />}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
