import { LegalPage } from '@/components/LegalPage';

export default function Loading() {
  return (
    <LegalPage title="Noticias" subtitle="Cargando..." wide>
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-900 overflow-hidden">
            <div className="h-36 bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-3.5 w-full rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-3.5 w-2/3 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
