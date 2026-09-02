// Nivel mínimo que desbloquea cada recompensa — un solo lugar para agregar
// más niveles/perks después sin tocar la lógica que los revisa (API y UI
// solo llaman a hasPerk()).
export const PERK_LEVELS = {
  profileBanner: 2,
} as const;

export type Perk = keyof typeof PERK_LEVELS;

export function hasPerk(level: number, perk: Perk): boolean {
  return level >= PERK_LEVELS[perk];
}
