import { LegalPage } from '@/components/LegalPage';

export default function Loading() {
  return (
    <LegalPage title="Ranking Global" subtitle="Cargando..." wide>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        ))}
      </div>
    </LegalPage>
  );
}
