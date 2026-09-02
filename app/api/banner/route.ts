import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { levelForXp } from '@/lib/level';
import { hasPerk } from '@/lib/perks';

export const dynamic = 'force-dynamic';

// POST /api/banner — body: { bannerUrl: string | null }
// null quita el banner (siempre permitido, incluso si el nivel ya no
// alcanzara — no tiene sentido bloquear quitar algo que ya se tenía).
// Subir uno nuevo sí exige el nivel del perk profileBanner.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { bannerUrl } = await req.json();

    if (bannerUrl !== null) {
      if (typeof bannerUrl !== 'string' || !bannerUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'URL de banner inválida' }, { status: 400 });
      }

      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).maybeSingle();
      const level = levelForXp(profile?.xp ?? 0);
      if (!hasPerk(level, 'profileBanner')) {
        return NextResponse.json({ error: 'Todavía no desbloqueas el banner de perfil' }, { status: 403 });
      }
    }

    const { error } = await supabase.from('profiles').upsert({ id: userId, banner_url: bannerUrl }, { onConflict: 'id' });
    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bannerUrl });
  } catch (err) {
    console.error('Error en /api/banner:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
