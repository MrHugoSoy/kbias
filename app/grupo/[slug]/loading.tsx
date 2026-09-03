import { LegalPage } from '@/components/LegalPage';

// Refleja la forma real de GroupDetailCard (banner + avatar superpuesto,
// pestañas, grid de información) para que no "salte" al llegar los datos.
export default function Loading() {
  return (
    <LegalPage title="Cargando..." subtitle="Un momento...">
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-36 sm:h-52 bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="absolute -bottom-8 left-4 sm:left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>

        <div className="pt-9 flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <div className="h-7 w-40 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-3.5 w-24 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
        </div>

        <div className="h-4 w-2/3 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />

        <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-16 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      </div>
    </LegalPage>
  );
}
