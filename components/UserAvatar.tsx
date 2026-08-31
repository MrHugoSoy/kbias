import PixelAvatar from './PixelAvatar';

// Icono de usuario compartido por ActivityFeed, DonorSidebar y
// GroupComments: foto real si el usuario subió una, si no el animalito
// pixel derivado de su seed/especie. Antes cada uno reimplementaba este
// mismo condicional por separado.
export default function UserAvatar({
  avatarUrl,
  seed,
  species,
  size,
}: {
  avatarUrl: string | null;
  seed: string;
  species: string | null;
  size: number;
}) {
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <PixelAvatar seed={seed} species={species} size={size} />
  );
}
