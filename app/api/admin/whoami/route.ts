import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedAdminUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// GET /api/admin/whoami — solo dice si la sesión actual es admin, para que
// el nav pueda decidir si muestra el link a /admin/noticias. No expone
// ADMIN_EMAILS al cliente en ningún momento.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ isAdmin: false }, { status: 403 });
  return NextResponse.json({ isAdmin: true });
}
