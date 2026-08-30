'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthModal({
  onClose,
  onAuthed,
}: {
  onClose: () => void;
  onAuthed: () => void;
}) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Escribe tu correo y contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Sin esto, Supabase manda el link de confirmación al "Site URL"
            // configurado en el dashboard — que puede quedarse apuntando a
            // localhost si no se actualiza al pasar a producción. Con esto
            // el link siempre regresa al dominio real desde el que se
            // registró la persona.
            emailRedirectTo: window.location.origin,
            data: {
              marketing_opt_in: marketingOptIn,
              marketing_opt_in_at: marketingOptIn ? new Date().toISOString() : null,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          onAuthed();
        } else {
          setCheckEmail(true);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        onAuthed();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4">
        {checkEmail ? (
          <>
            <h3 className="text-xl font-bold">Revisa tu correo</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Te mandamos un link de confirmación a <strong>{email}</strong>. Confírmalo y luego inicia sesión para votar.
            </p>
            <button onClick={onClose} className="w-full py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold">{mode === 'register' ? 'Crea tu cuenta gratis' : 'Inicia sesión'}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Necesitas una cuenta para votar — así evitamos que una sola persona vote varias veces. Un voto gratis por
              cuenta, cada día.
            </p>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2"
            />
            {mode === 'register' && (
              <label className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Quiero recibir correos de K-pop Wars con novedades, nuevos rankings y promociones de nuestros
                  socios (opcional — puedes cancelarlo cuando quieras desde tu perfil).
                </span>
              </label>
            )}
            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50"
              >
                {loading ? 'Un momento...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
              className="w-full text-xs text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400"
            >
              {mode === 'register' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
