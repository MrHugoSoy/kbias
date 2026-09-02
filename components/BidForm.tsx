'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Gavel, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch, getAccessToken } from '@/lib/authFetch';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';
import AuthModal from './AuthModal';

const DAILY_POINT_BUDGET = 5;

type Group = { id: string; name: string; fandom_name: string | null };

export default function BidForm({ groups }: { groups: Group[] }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [points, setPoints] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [pointsRemaining, setPointsRemaining] = useState(DAILY_POINT_BUDGET);
  // Evita mostrar el formulario de voto por un instante y luego cambiar al
  // aviso de "sin puntos" cuando la sesión sí tiene el presupuesto agotado.
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const token = await getAccessToken();
      if (!token) {
        setCheckingStatus(false);
        return;
      }
      const res = await authFetch('/api/vote');
      if (res.ok) {
        const data = await res.json();
        setPointsRemaining(data.pointsRemaining ?? DAILY_POINT_BUDGET);
      }
      setCheckingStatus(false);
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
        body: JSON.stringify({ groupId, points, message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        const remaining = Math.max(0, pointsRemaining - points);
        setPointsRemaining(remaining);
        setPoints(Math.min(points, remaining) || 1);
        setMessage('');
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

  return (
    <section className="border-2 border-pink-700/60 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Gavel className="w-6 h-6 text-pink-500" />
        <div>
          <h2 className="font-bold">VOTA GRATIS</h2>
          <p className="text-xs text-neutral-500">5 puntos por cuenta cada día — repártelos como quieras</p>
        </div>
      </div>

      {checkingStatus ? (
        <div className="space-y-3">
          <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>
      ) : pointsRemaining === 0 ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Ya repartiste tus {DAILY_POINT_BUDGET} puntos de hoy. Vuelve mañana para más.
        </p>
      ) : (
        <>
          <p className="text-xs text-pink-500 font-semibold">
            Te quedan {pointsRemaining} de {DAILY_POINT_BUDGET} puntos hoy
          </p>

          <div className="grid grid-cols-[1fr_auto] gap-2">
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
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wide">Puntos</label>
              <div className="relative mt-1">
                <select
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="appearance-none bg-neutral-100 dark:bg-neutral-900 rounded-lg pl-3 pr-8 py-2"
                >
                  {Array.from({ length: pointsRemaining }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wide">Mensaje (opcional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
              placeholder="Deja un mensaje para el feed en vivo"
              rows={2}
              className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[10px] text-neutral-500 text-right mt-1">
              {message.length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold disabled:opacity-50"
          >
            {loading ? (
              'Enviando...'
            ) : (
              <span className="inline-flex items-center justify-center gap-1">
                Dar {points} {points === 1 ? 'punto' : 'puntos'} <Zap className="w-4 h-4 fill-current" />
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
