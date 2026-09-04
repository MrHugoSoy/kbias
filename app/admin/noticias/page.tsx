'use client';

import { useEffect, useState } from 'react';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { LegalPage } from '@/components/LegalPage';
import AuthModal from '@/components/AuthModal';

type Group = { id: string; name: string };
type Post = {
  id: string;
  title: string;
  body: string;
  cover_url: string | null;
  category: string | null;
  group_id: string | null;
  published_at: string;
  group: { name: string; slug: string } | null;
};

const EMPTY_FORM = { id: '', title: '', body: '', coverUrl: '', category: '', groupId: '' };

// Panel simple para cargar/editar/borrar noticias sin tocar el SQL Editor a
// mano — protegido server-side en /api/admin/news (ADMIN_EMAILS), esta
// página solo intenta la llamada y muestra "No autorizado" si falla.
export default function AdminNoticiasPage() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function loadPosts() {
    const res = await authFetch('/api/admin/news');
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setPosts(data.posts ?? []);
    setAuthorized(true);
  }

  useEffect(() => {
    if (!userId) return;
    loadPosts();
    supabase.from('groups').select('id, name').order('name').then(({ data }) => setGroups(data ?? []));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await authFetch(isEdit ? `/api/admin/news/${form.id}` : '/api/admin/news', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, body: form.body, coverUrl: form.coverUrl, category: form.category, groupId: form.groupId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Algo salió mal');
        return;
      }
      setForm(EMPTY_FORM);
      await loadPosts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta noticia? No se puede deshacer.')) return;
    const res = await authFetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (res.ok) await loadPosts();
  }

  function startEdit(post: Post) {
    setForm({ id: post.id, title: post.title, body: post.body, coverUrl: post.cover_url ?? '', category: post.category ?? '', groupId: post.group_id ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (userId === undefined) return null;

  if (!userId) {
    return (
      <LegalPage title="Admin · Noticias" subtitle="Inicia sesión para continuar.">
        <button
          onClick={() => setShowAuth(true)}
          className="bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-5 py-2.5 rounded-lg"
        >
          Iniciar sesión
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />}
      </LegalPage>
    );
  }

  if (authorized === false) {
    return (
      <LegalPage title="Admin · Noticias" subtitle="">
        <div className="text-center py-10 space-y-2">
          <Lock className="w-10 h-10 mx-auto text-neutral-400" />
          <p className="text-neutral-500">Esta cuenta no tiene acceso al panel de administración.</p>
        </div>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Admin · Noticias" subtitle="Crear, editar y borrar noticias." wide>
      <form onSubmit={handleSubmit} className="space-y-3 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <h2 className="font-bold">{form.id ? 'Editar noticia' : 'Nueva noticia'}</h2>
        <input
          type="text"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          maxLength={140}
        />
        <textarea
          placeholder="Cuerpo de la noticia"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={5}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          maxLength={4000}
        />
        <input
          type="text"
          placeholder="URL de imagen de portada (opcional)"
          value={form.coverUrl}
          onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Categoría para la tarjeta (opcional, ej. K-POP, RANKING, BATALLAS)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          maxLength={30}
        />
        <select
          value={form.groupId}
          onChange={(e) => setForm({ ...form, groupId: e.target.value })}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Noticia general (sin grupo)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.body.trim()}
            className="bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Publicar'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-sm text-neutral-500 px-3">
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="font-bold">Noticias publicadas ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay noticias.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl overflow-hidden">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{post.title}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {post.group ? post.group.name : 'General'} ·{' '}
                    {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </p>
                </div>
                <button onClick={() => startEdit(post)} className="p-2 text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-neutral-500 hover:text-red-500" title="Borrar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </LegalPage>
  );
}
