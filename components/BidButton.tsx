'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import AuthModal from './AuthModal';
import VoteMessageModal from './VoteMessageModal';

export default function BidButton({
  groupId,
  groupName,
  compact,
}: {
  groupId: string;
  groupName: string;
  compact?: boolean;
}) {
  const [showAuth, setShowAuth] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [pointsRemaining, setPointsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'ok' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  async function castVote(voteMessage: string, points: number) {
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, points, message: voteMessage || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult('ok');
        setMessage('¡Puntos entregados!');
        setShowMessageModal(false);
      } else {
        setResult('error');
        setMessage(data.error || 'Algo salió mal');
      }
    } catch {
      setResult('error');
      setMessage('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 4000);
    }
  }

  async function handleClick() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setShowAuth(true);
      return;
    }
    setChecking(true);
    try {
      const res = await authFetch('/api/vote');
      const data2 = await res.json();
      const remaining = res.ok ? data2.pointsRemaining ?? 0 : 0;
      if (remaining <= 0) {
        setResult('error');
        setMessage('Ya repartiste tus 5 puntos de hoy. Vuelve mañana.');
        setTimeout(() => setResult(null), 4000);
        return;
      }
      setPointsRemaining(remaining);
      setShowMessageModal(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {/* flex (no inline-flex) para que el ancho lo fije el contenedor, no el
          hijo más ancho — con inline-flex, el mensaje largo ensanchaba esta
          caja y el botón (alineado con items-end) se corría a la derecha
          para seguir pegado al nuevo borde. */}
      <div className={(compact ? 'w-full' : 'flex flex-col items-center') + ' gap-1'}>
        <button
          onClick={handleClick}
          disabled={loading || checking}
          className={
            (compact
              ? 'w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-xs px-2 py-1.5 rounded-lg transition'
              : 'bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg transition whitespace-nowrap') +
            ' disabled:opacity-50'
          }
        >
          {loading ? 'Votando...' : compact ? 'Votar' : (
            <>
              <span className="sm:hidden">Votar</span>
              <span className="hidden sm:inline">Vota por {groupName}</span>
            </>
          )}
        </button>
        {/* Siempre montado (con min-height reservado) para que el mensaje no
            empuje el resto de la tarjeta al aparecer — antes, al no tener
            espacio reservado, "aparecía" el párrafo y recorría hacia arriba
            la biografía del grupo dentro de la tarjeta de altura fija. */}
        <p
          className={
            'text-[11px] min-h-[2.2em] leading-tight text-center ' +
            (result ? (result === 'ok' ? 'text-green-500' : 'text-red-500') : 'invisible')
          }
        >
          {message || ' '}
        </p>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={() => {
            setShowAuth(false);
            handleClick();
          }}
        />
      )}

      {showMessageModal && (
        <VoteMessageModal
          groupName={groupName}
          pointsRemaining={pointsRemaining}
          loading={loading}
          onClose={() => setShowMessageModal(false)}
          onConfirm={castVote}
        />
      )}
    </>
  );
}
