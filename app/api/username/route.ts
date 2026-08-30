import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/;
const RESERVED = ['admin', 'administrador', 'kpopwars', 'soporte', 'support', 'root', 'moderador', 'staff'];

// POST /api/username — body: { username: string }
// El nombre se normaliza a minúsculas server-side y se guarda con el
// service role, después de verificar el token real de sesión. El unique
// constraint en `profiles.username` es la defensa real contra duplicados
// (protege contra condiciones de carrera); la validación de aquí es solo
// para dar un mensaje de error más claro.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { username } = await req.json();
    const normalized = String(username ?? '').trim().toLowerCase();

    if (!USERNAME_REGEX.test(normalized)) {
      return NextResponse.json(
        { error: 'El nombre debe tener 3-20 caracteres: letras, números, _ o -' },
        { status: 400 }
      );
    }
    if (RESERVED.includes(normalized)) {
      return NextResponse.json({ error: 'Ese nombre de usuario no está disponible' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, username: normalized }, { onConflict: 'id' });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, username: normalized });
  } catch (err) {
    console.error('Error en /api/username:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
