import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { SPECIES_KEYS } from '@/components/PixelAvatar';

export const dynamic = 'force-dynamic';

// POST /api/avatar — body: { species: string } o { avatarUrl: string }
// Los dos modos son excluyentes: elegir un animalito borra la foto subida
// y viceversa. El id nunca se toma del cliente, se verifica el token real
// de sesión.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { species, avatarUrl } = await req.json();

    let update: { avatar_species: string | null; avatar_url: string | null };

    if (avatarUrl) {
      if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'URL de foto inválida' }, { status: 400 });
      }
      update = { avatar_url: avatarUrl, avatar_species: null };
    } else if (species) {
      if (!SPECIES_KEYS.includes(species)) {
        return NextResponse.json({ error: 'Animal inválido' }, { status: 400 });
      }
      update = { avatar_species: species, avatar_url: null };
    } else {
      return NextResponse.json({ error: 'Falta species o avatarUrl' }, { status: 400 });
    }

    const { error } = await supabase.from('profiles').upsert({ id: userId, ...update }, { onConflict: 'id' });
    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ...update });
  } catch (err) {
    console.error('Error en /api/avatar:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
