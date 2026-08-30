// Avatar pixel-art de animalito. Si no se pasa `species` explícito, se
// deriva de forma determinística del seed (mismo seed = mismo animal
// siempre) — es el fallback mientras el usuario no elija uno ni suba foto.
type Species = {
  key: string;
  name: string;
  bg: string;
  fur: string;
  ear: string;
  snout: string;
  earShape: 'pointy' | 'round' | 'floppy';
  accent?: 'mask' | 'stripes' | 'blush';
};

export const SPECIES: Species[] = [
  { key: 'gato', name: 'Gato', bg: '#FDEBD3', fur: '#F0A050', ear: '#C97A2E', snout: '#FFFFFF', earShape: 'pointy' },
  { key: 'zorro', name: 'Zorro', bg: '#FBE0D2', fur: '#E8703A', ear: '#2B2B2B', snout: '#FFFFFF', earShape: 'pointy' },
  { key: 'panda', name: 'Panda', bg: '#EAEAEA', fur: '#FAFAF7', ear: '#2B2B2B', snout: '#F6C6C6', earShape: 'round', accent: 'mask' },
  { key: 'oso', name: 'Oso', bg: '#E8DCCB', fur: '#8B5E3C', ear: '#6E4A2E', snout: '#D8B48A', earShape: 'round' },
  { key: 'conejo', name: 'Conejo', bg: '#F6E3EC', fur: '#EDEDED', ear: '#F3B6CB', snout: '#F3B6CB', earShape: 'floppy', accent: 'blush' },
  { key: 'tigre', name: 'Tigre', bg: '#FCE7CE', fur: '#F0973A', ear: '#2B2B2B', snout: '#FFFFFF', earShape: 'pointy', accent: 'stripes' },
];

export const SPECIES_KEYS = SPECIES.map((s) => s.key);

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function pixelAvatarSpecies(seed: string): Species {
  return SPECIES[hashSeed(seed) % SPECIES.length];
}

function getSpecies(seed: string, speciesKey?: string | null): Species {
  if (speciesKey) {
    const found = SPECIES.find((s) => s.key === speciesKey);
    if (found) return found;
  }
  return pixelAvatarSpecies(seed);
}

export default function PixelAvatar({
  seed,
  species: speciesKey,
  size = 40,
}: {
  seed: string;
  species?: string | null;
  size?: number;
}) {
  const species = getSpecies(seed, speciesKey);

  return (
    <div
      className="rounded-full overflow-hidden shrink-0"
      style={{ width: size, height: size, background: species.bg }}
      title={species.name}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" shapeRendering="crispEdges">
        {species.earShape === 'pointy' && (
          <>
            <polygon points="10,35 25,0 30,35" fill={species.ear} />
            <polygon points="90,35 75,0 70,35" fill={species.ear} />
          </>
        )}
        {species.earShape === 'round' && (
          <>
            <rect x="8" y="5" width="24" height="24" fill={species.ear} />
            <rect x="68" y="5" width="24" height="24" fill={species.ear} />
          </>
        )}
        {species.earShape === 'floppy' && (
          <>
            <rect x="15" y="-5" width="16" height="45" fill={species.ear} />
            <rect x="69" y="-5" width="16" height="45" fill={species.ear} />
          </>
        )}

        <rect x="10" y="25" width="80" height="65" fill={species.fur} />

        {species.accent === 'mask' && (
          <>
            <rect x="18" y="40" width="20" height="16" fill="#2B2B2B" />
            <rect x="62" y="40" width="20" height="16" fill="#2B2B2B" />
          </>
        )}
        {species.accent === 'stripes' && (
          <>
            <rect x="15" y="28" width="8" height="20" fill="#2B2B2B" />
            <rect x="77" y="28" width="8" height="20" fill="#2B2B2B" />
            <rect x="45" y="25" width="10" height="15" fill="#2B2B2B" />
          </>
        )}

        <rect x="26" y="46" width="10" height="10" fill="#222" />
        <rect x="64" y="46" width="10" height="10" fill="#222" />

        {species.accent === 'blush' && (
          <>
            <rect x="14" y="62" width="12" height="8" fill="#F49AC2" />
            <rect x="74" y="62" width="12" height="8" fill="#F49AC2" />
          </>
        )}

        <rect x="35" y="68" width="30" height="18" fill={species.snout} />
        <rect x="45" y="72" width="10" height="8" fill="#2B2B2B" />
      </svg>
    </div>
  );
}
