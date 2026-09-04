'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Trophy, Swords, Users, Award, User, Newspaper } from 'lucide-react';

// Nav de escritorio vive oculta en celular (md:hidden en el <nav> del
// header) — este botón le da a los mismos links (RANKING/BATALLAS/GRUPOS/
// NOTICIAS/SALÓN DE LA FAMA) una forma de abrirse en pantallas chicas.
// El logo del header ya lleva a "/", así que no hay un link INICIO — y
// "CÓMO FUNCIONA"/FAQ viven en el footer, no en este menú.
export default function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:opacity-80 transition"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden flex flex-col text-sm">
            <a href="/#ranking" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Trophy className="w-4 h-4" /> RANKING
            </a>
            <Link href="/batallas" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Swords className="w-4 h-4" /> BATALLAS
            </Link>
            <Link href="/grupos" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Users className="w-4 h-4" /> GRUPOS
            </Link>
            <Link href="/noticias" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Newspaper className="w-4 h-4" /> NOTICIAS
            </Link>
            <Link href="/salon-de-la-fama" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Award className="w-4 h-4" /> SALÓN DE LA FAMA
            </Link>
            <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <User className="w-4 h-4" /> MI PERFIL
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
