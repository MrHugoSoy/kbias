// Paquetes de puntos con precio fijo. El pago sigue atado a UN grupo en el
// momento de la compra (igual que antes) — lo único que cambia es que ya no
// se escribe un monto libre, se elige uno de estos paquetes. Los puntos
// (no los dólares) son lo que se acumula en el ranking de cada grupo.
//
// Ajusta precios/puntos aquí — nunca en el cliente: /api/bid vuelve a
// buscar el paquete por su id en este archivo, así que un valor manipulado
// en el navegador no tiene ningún efecto en lo que realmente se cobra.
export type PointPackage = {
  id: string;
  priceCents: number;
  points: number;
};

export const POINT_PACKAGES: PointPackage[] = [
  { id: 'pts_1', priceCents: 100, points: 50 },
  { id: 'pts_3', priceCents: 300, points: 175 },
  { id: 'pts_9', priceCents: 900, points: 600 },
  { id: 'pts_25', priceCents: 2500, points: 1800 },
  { id: 'pts_75', priceCents: 7500, points: 6000 },
];

export function getPointPackage(id: string): PointPackage | undefined {
  return POINT_PACKAGES.find((p) => p.id === id);
}

export function formatPoints(points: number): string {
  return points.toLocaleString('es-MX');
}
