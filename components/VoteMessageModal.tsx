'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';

export default function VoteMessageModal({
  groupName,
  pointsRemaining,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  groupName: string;
  pointsRemaining: number;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (message: string, points: number) => void;
}) {
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4">
        <h3 className="text-xl font-bold">Vota por {groupName}</h3>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">
            Puntos (te quedan {pointsRemaining} hoy)
          </label>
          <div className="relative mt-1">
            <select
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full appearance-none bg-neutral-100 dark:bg-neutral-800 rounded-lg pl-3 pr-9 py-2"
            >
              {Array.from({ length: pointsRemaining }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'punto' : 'puntos'}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

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
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(message.trim(), points)}
            disabled={loading || pointsRemaining < 1}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold disabled:opacity-50"
          >
            {loading ? 'Enviando...' : pointsRemaining < 1 ? 'Sin puntos hoy' : `Dar ${points} ${points === 1 ? 'punto' : 'puntos'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
