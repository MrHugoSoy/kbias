import { LegalPage } from '@/components/LegalPage';

export default function Loading() {
  return (
    <LegalPage title="Salón de la Fama" subtitle="Cargando..." wide>
      <div className="space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
