'use client';

import { useState } from 'react';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';

export default function VoteMessageModal({
  groupName,
  loading,
  onClose,
  onConfirm,
}: {
  groupName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
}) {
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4">
        <h3 className="text-xl font-bold">Vota por {groupName}</h3>
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
            placeholder="Deja un mensaje (opcional)"
            rows={3}
            className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-[10px] text-neutral-500 text-right mt-1">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(message.trim())}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold disabled:opacity-50"
          >
            {loading ? 'Votando...' : 'Votar'}
          </button>
        </div>
      </div>
    </div>
  );
}
