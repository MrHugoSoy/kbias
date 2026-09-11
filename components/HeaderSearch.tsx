'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Mic2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type GroupOption = { id: string; name: string; slug: string; fandom_name: string | null; image_url: string | null };

// Buscador de grupos del header — carga la lista completa una sola vez
// (son pocas decenas de filas) y filtra en el cliente mientras se escribe,
// en vez de pegarle a la base con cada tecla.
export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<GroupOption[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || groups) return;
    supabase
      .from('groups')
      .select('id, name, slug, fandom_name, image_url')
      .order('name', { ascending: true })
      .then(({ data }) => setGroups(data ?? []));
  }, [open, groups]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const trimmed = query.trim().toLowerCase();
  const results =
    trimmed.length === 0
      ? []
      : (groups ?? []).filter(
          (g) => g.name.toLowerCase().includes(trimmed) || g.fandom_name?.toLowerCase().includes(trimmed)
        ).slice(0, 8);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-full px-3 py-1.5 w-48 sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar grupo..."
            className="bg-transparent text-sm w-full outline-none"
          />
          <button onClick={() => { setOpen(false); setQuery(''); }} aria-label="Cerrar búsqueda" className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buscar grupo"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:opacity-80 transition"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {open && trimmed.length > 0 && (
        <div className="absolute right-0 top-12 z-50 w-72 max-w-[90vw] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-4">Sin resultados para "{query.trim()}"</p>
          ) : (
            results.map((g) => (
              <Link
                key={g.id}
                href={`/grupo/${g.slug}`}
                onClick={() => { setOpen(false); setQuery(''); }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                  {g.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" />
                  ) : (
                    <Mic2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{g.name}</p>
                  {g.fandom_name && <p className="text-xs text-violet-500 truncate">{g.fandom_name}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
