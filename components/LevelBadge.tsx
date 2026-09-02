import { levelForXp } from '@/lib/level';

// Insignia de nivel junto al nombre de un usuario — en la Zona de fans y en
// el feed de actividad, para que se note quién es más activo en el sitio.
export default function LevelBadge({ xp }: { xp: number }) {
  return (
    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full leading-none shrink-0">
      Nv. {levelForXp(xp)}
    </span>
  );
}
