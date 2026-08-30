'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import AuthModal from './AuthModal';

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'ok' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  async function castVote() {
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult('ok');
        setMessage('¡Voto registrado!');
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
    castVote();
  }

  return (
    <>
      <div className={compact ? 'w-full' : 'inline-flex flex-col items-end gap-1'}>
        <button
          onClick={handleClick}
          disabled={loading}
          className={
            (compact
              ? 'w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs px-2 py-1.5 rounded-lg transition'
              : 'bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-lg transition whitespace-nowrap') +
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
        {result && (
          <p className={'text-[11px] ' + (result === 'ok' ? 'text-green-500' : 'text-red-500')}>{message}</p>
        )}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={() => {
            setShowAuth(false);
            castVote();
          }}
        />
      )}
    </>
  );
}
