import { LegalPage } from '@/components/LegalPage';

export default function Loading() {
  return (
    <LegalPage title="Cargando..." subtitle="Un momento...">
      <div className="border-2 border-pink-600/40 rounded-2xl p-8 text-center space-y-4">
        <div className="w-56 h-56 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        <div className="h-8 w-48 mx-auto rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        <div className="h-4 w-32 mx-auto rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        <div className="h-10 w-40 mx-auto rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
      </div>
    </LegalPage>
  );
}
