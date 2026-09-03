'use client';

import { useEffect, useState } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { LegalPage } from '@/components/LegalPage';
import AuthModal from '@/components/AuthModal';
import type { GroupBattle } from '@/lib/types';

type Group = { id: string; name: string };

const EMPTY_FORM = { groupAId: '', groupBId: '', startsAt: '', durationHours: '120' };

const STATUS_LABEL: Record<GroupBattle['status'], string> = {
  active: 'En curso',
  upcoming: 'Próxima',
  finished: 'Finalizada',
};

// Panel para emparejar batallas de grupo a mano (en vez de dejar que el
// emparejado automático de /batallas elija al azar) — protegido
// server-side en /api/admin/group-battles (ADMIN_EMAILS), igual que el
// panel de noticias.
export default function AdminBatallasPage() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [battles, setBattles] = useState<GroupBattle[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function loadBattles() {
    const res = await authFetch('/api/admin/group-battles');
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setBattles(data.battles ?? []);
    setAuthorized(true);
  }

  useEffect(() => {
    if (!userId) return;
    loadBattles();
    supabase.from('groups').select('id, name').order('name').then(({ data }) => setGroups(data ?? []));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/group-battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupAId: form.groupAId,
          groupBId: form.groupBId,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          durationHours: Number(form.durationHours),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Algo salió mal');
        return;
      }
      setForm(EMPTY_FORM);
      await loadBattles();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Cancelar esta batalla? Se borran también sus votos. No se puede deshacer.')) return;
    const res = await authFetch(`/api/admin/group-battles/${id}`, { method: 'DELETE' });
    if (res.ok) await loadBattles();
  }

  if (userId === undefined) return null;

  if (!userId) {
    return (
      <LegalPage title="Admin · Batallas" subtitle="Inicia sesión para continuar.">
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
      <LegalPage title="Admin · Batallas" subtitle="">
        <div className="text-center py-10 space-y-2">
          <Lock className="w-10 h-10 mx-auto text-neutral-400" />
          <p className="text-neutral-500">Esta cuenta no tiene acceso al panel de administración.</p>
        </div>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Admin · Batallas" subtitle="Emparejar grupos a mano para /batallas." wide>
      <form onSubmit={handleSubmit} className="space-y-3 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <h2 className="font-bold">Nueva batalla</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={form.groupAId}
            onChange={(e) => setForm({ ...form, groupAId: e.target.value })}
            className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Grupo A...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={form.groupBId}
            onChange={(e) => setForm({ ...form, groupBId: e.target.value })}
            className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Grupo B...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Inicio (opcional — vacío = ahora mismo)</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Duración (horas)</label>
            <input
              type="number"
              min={1}
              max={720}
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving || !form.groupAId || !form.groupBId}
          className="bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Creando...' : 'Emparejar'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-bold">Batallas ({battles.length})</h2>
        {battles.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay batallas.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
            {battles.map((b) => (
              <div key={b.battle_id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">
                    {b.group_a_name} <span className="text-neutral-400 font-normal">vs</span> {b.group_b_name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {STATUS_LABEL[b.status]} · {b.group_a_points.toLocaleString('es-MX')} - {b.group_b_points.toLocaleString('es-MX')} votos ·{' '}
                    {new Date(b.starts_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })} →{' '}
                    {new Date(b.ends_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button onClick={() => handleDelete(b.battle_id)} className="p-2 text-neutral-500 hover:text-red-500" title="Cancelar">
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
