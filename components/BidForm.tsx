'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Gavel, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch, getAccessToken } from '@/lib/authFetch';
import AuthModal from './AuthModal';

type Group = { id: string; name: string; fandom_name: string | null };

export default function BidForm({ groups }: { groups: Group[] }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [votedToday, setVotedToday] = useState<string | null>(null); // group_id o null

  useEffect(() => {
    async function checkStatus() {
      const token = await getAccessToken();
      if (!token) return;
      const res = await authFetch('/api/vote');
      if (res.ok) {
        const data = await res.json();
        if (data.votedToday) setVotedToday(data.groupId);
      }
    }
    checkStatus();
  }, []);

  async function castVote() {
    setError('');
    if (!groupId) {
      setError('Elige un grupo');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (res.ok) {
        setVotedToday(groupId);
      } else {
        setError(data.error || 'Algo salió mal');
      }
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setShowAuth(true);
      return;
    }
    castVote();
  }

  const votedGroupName = votedToday ? groups.find((g) => g.id === votedToday)?.name : null;

  return (
    <section className="border-2 border-pink-700/60 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Gavel className="w-6 h-6 text-pink-500" />
        <div>
          <h2 className="font-bold">VOTA GRATIS HOY</h2>
          <p className="text-xs text-neutral-500">Un voto por cuenta, cada día — sin costo</p>
        </div>
      </div>

      {votedToday ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Ya votaste hoy por <strong>{votedGroupName ?? 'tu grupo'}</strong>. Vuelve mañana para votar de nuevo.
        </p>
      ) : (
        <>
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wide">Grupo</label>
            <div className="relative mt-1">
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full appearance-none bg-neutral-100 dark:bg-neutral-900 rounded-lg pl-3 pr-9 py-2"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.fandom_name ? `(${g.fandom_name})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold disabled:opacity-50"
          >
            {loading ? (
              'Votando...'
            ) : (
              <span className="inline-flex items-center justify-center gap-1">
                Votar <Zap className="w-4 h-4 fill-current" />
              </span>
            )}
          </button>
        </>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={() => {
            setShowAuth(false);
            castVote();
          }}
        />
      )}
    </section>
  );
}
