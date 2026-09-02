// Nivel derivado del XP acumulado — nunca se guarda, se calcula siempre con
// esta misma fórmula (curva cuadrática: cada nivel pide más XP que el
// anterior). xpForLevel(n) = 25 * (n-1)^2, así que level 1 empieza en 0 XP,
// nivel 2 en 25, nivel 3 en 100, nivel 4 en 225...
export function levelForXp(xp: number): number {
  return Math.floor(1 + Math.sqrt(Math.max(0, xp) / 25));
}

export function xpForLevel(level: number): number {
  return 25 * (level - 1) ** 2;
}
