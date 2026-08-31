import LogoKW from '@/components/icons/LogoKW';

// Se muestra mientras el home (revalidate=0, siempre datos frescos) carga
// al navegar hacia "/" desde otra página — evita el salto en blanco entre
// páginas y da una sensación de carga más orgánica.
export default function Loading() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-[#0a0a0c] dark:text-white">
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
        <div className="flex justify-center">
          <div className="h-7 w-72 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>

        <div className="grid sm:grid-cols-[1fr_1.2fr_1fr] sm:items-end gap-4">
          <div className="sm:order-1 h-56 sm:h-[390px] rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="sm:order-2 h-64 sm:h-[440px] rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="sm:order-3 h-56 sm:h-[390px] rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>

        <div className="h-40 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
      </div>
    </main>
  );
}
