import { LegalPage } from '@/components/LegalPage';

export default function Loading() {
  return (
    <LegalPage title="Noticias K-pop" subtitle="Cargando..." wide>
      <div className="space-y-6">
        <div className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        <div className="grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="h-40 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </LegalPage>
  );
}
