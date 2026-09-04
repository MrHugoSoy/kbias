import LogoKW from '@/components/icons/LogoKW';

// Se muestra mientras el home (revalidate=0, siempre datos frescos) carga
// al navegar hacia "/" desde otra página — evita el salto en blanco entre
// páginas y da una sensación de carga más orgánica. Debe reflejar la forma
// real de app/page.tsx (Hero, Ranking Global, grupos 6-17 + actividad,
// batallas de canciones, total de la comunidad) para que no "salte" al
// llegar los datos reales.
export default function Loading() {
  return (
    <main className="min-h-screen bg-[#eef2fb] text-neutral-900 dark:bg-[#0a0a0c] dark:text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-900 max-w-4xl xl:max-w-[75.5rem] mx-auto">
        <div className="flex items-center gap-2">
          <LogoKW className="w-10 h-10 text-pink-500" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-2.5 w-36 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </header>

      <div className="max-w-4xl xl:max-w-[75.5rem] mx-auto px-4 py-8 space-y-10">
        {/* Hero: texto + botones a la izquierda, collage 2x2 a la derecha */}
        <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 items-center py-4">
          <div className="space-y-5">
            <div className="h-4 w-40 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="space-y-2">
              <div className="h-11 w-56 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-11 w-64 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            </div>
            <div className="h-4 w-52 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-11 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            </div>
            <div className="h-3 w-64 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[16/9] rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Ranking Global: encabezado + top 5 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-3 w-28 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl shadow-sm dark:ring-1 dark:ring-white/10 p-4 space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                <div className="h-3.5 w-16 mx-auto rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                <div className="h-3 w-12 mx-auto rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                <div className="h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-3 w-72 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>

        {/* Grupos 6-17 + actividad en vivo, lado a lado */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {[0, 1].map((col) => (
            <div key={col} className="rounded-xl shadow-sm dark:ring-1 dark:ring-white/10 divide-y divide-neutral-200 dark:divide-neutral-900 overflow-hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                    <div className="h-2.5 w-1/3 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Batallas de canciones */}
        <div className="space-y-4">
          <div className="h-5 w-48 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="grid sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Total de la comunidad */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="h-3.5 w-44 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="h-10 w-56 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
