'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Group = { id: string; name: string; fandom_name: string | null };

export default function ClaimForm({ groups }: { groups: Group[] }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError('');

    if (!groupId) {
      setError('Elige un grupo');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      setError('Tu nombre y correo son obligatorios');
      return;
    }
    if (proofUrl && !/^https?:\/\/.+/.test(proofUrl)) {
      setError('El link de verificación debe empezar con http:// o https://');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: insertError } = await supabase.from('claim_requests').insert({
        group_id: groupId,
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        proof_url: proofUrl.trim() || null,
        message: message.trim() || null,
      });
      if (insertError) {
        setError('Algo salió mal, intenta de nuevo');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border-2 border-pink-600 rounded-2xl p-6 text-center space-y-2">
        <p className="text-lg font-bold">¡Solicitud enviada!</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          La revisamos a mano y te contactamos al correo que dejaste.
        </p>
      </div>
    );
  }

  return (
    <section className="border-2 border-pink-700/60 rounded-2xl p-6 space-y-4">
      <div>
        <label className="text-xs text-neutral-500 uppercase tracking-wide">Grupo</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} {g.fandom_name ? `(${g.fandom_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Tu nombre</label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Tu correo</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500 uppercase tracking-wide">Link de verificación (opcional)</label>
        <input
          type="url"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="Cuenta oficial de Instagram/X, sitio de la agencia, etc."
          className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 uppercase tracking-wide">Mensaje (opcional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos tu relación con el grupo"
          rows={3}
          className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </section>
  );
}
