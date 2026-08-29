import { NextRequest, NextResponse } from 'next/server';
import { stripe, BID_LIMITS } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { isOffensive } from '@/lib/moderation';
import { siteUrl } from '@/lib/siteUrl';

// POST /api/bid
// body: { groupId: string, amountCents: number, supporterName?: string, isAnonymous?: boolean }
//
// Flujo:
// 1. Valida límites anti-fraude (min/max por transacción). Cualquier monto
//    dentro de esos límites es válido: el trono se decide por el TOTAL
//    acumulado por grupo, no por si esta puja "supera" algo — no hay
//    mínimo dinámico que cumplir para que la puja cuente.
// 2. Reserva una fila en `bids` con status='pending' ANTES de crear el
//    checkout de Stripe. Esto es lo que permite que el tope diario por IP
//    vea pujas "en curso" y no solo las ya confirmadas — si no, alguien
//    podía abrir varios checkouts en paralelo y superar el tope antes de
//    que cualquiera terminara de pagar.
// 3. La fila se confirma (status='succeeded') o se descarta
//    (status='failed') SOLO desde el webhook, nunca desde aquí — así
//    nadie puede sumar al total de su grupo sin haber pagado de verdad.
const PENDING_RESERVATION_MINUTES = 30;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let pendingBidId: string | null = null;

  try {
    const body = await req.json();
    const { groupId, amountCents, supporterName, isAnonymous, socialUrl } = body;

    if (!groupId || !amountCents) {
      return NextResponse.json({ error: 'Faltan datos: groupId y amountCents son requeridos' }, { status: 400 });
    }

    if (socialUrl && !isValidHttpUrl(socialUrl)) {
      return NextResponse.json({ error: 'El link de red social debe ser una URL válida (http/https)' }, { status: 400 });
    }

    if (!isAnonymous && supporterName && isOffensive(supporterName)) {
      return NextResponse.json({ error: 'Ese nombre no está permitido. Elige otro o puja de forma anónima.' }, { status: 400 });
    }

    if (amountCents < BID_LIMITS.MIN_CENTS) {
      return NextResponse.json({ error: `El monto mínimo es $${BID_LIMITS.MIN_CENTS / 100}` }, { status: 400 });
    }

    if (amountCents > BID_LIMITS.MAX_PER_TX_CENTS) {
      return NextResponse.json(
        { error: `El monto máximo por transacción es $${BID_LIMITS.MAX_PER_TX_CENTS / 100}. Puedes hacer varias pujas.` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    // Tope acumulado por IP en las últimas 24h, para frenar gasto compulsivo
    // (especialmente de menores usando la tarjeta de sus papás). Es una
    // defensa best-effort: alguien decidido puede cambiar de red, pero
    // frena el caso común de "seguir pujando sin pensarlo".
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    if (ip) {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const sincePending = new Date(Date.now() - PENDING_RESERVATION_MINUTES * 60 * 1000).toISOString();

      const [{ data: succeededBids }, { data: pendingBids }] = await Promise.all([
        supabase.from('bids').select('amount_cents').eq('ip_address', ip).eq('status', 'succeeded').gte('created_at', since24h),
        supabase.from('bids').select('amount_cents').eq('ip_address', ip).eq('status', 'pending').gte('created_at', sincePending),
      ]);
      const spentToday =
        (succeededBids ?? []).reduce((sum, b) => sum + b.amount_cents, 0) +
        (pendingBids ?? []).reduce((sum, b) => sum + b.amount_cents, 0);

      if (spentToday + amountCents > BID_LIMITS.DAILY_CAP_CENTS) {
        return NextResponse.json(
          {
            error: `Llegaste al tope de $${(BID_LIMITS.DAILY_CAP_CENTS / 100).toLocaleString('es-MX')} en pujas por hoy. Intenta de nuevo mañana.`,
          },
          { status: 400 }
        );
      }
    }

    // Reserva la puja ANTES de ir a Stripe, para que el tope de arriba
    // pueda contarla en el siguiente intento aunque este checkout no
    // haya terminado todavía.
    const { data: pendingBid, error: pendingError } = await supabase
      .from('bids')
      .insert({
        group_id: groupId,
        amount_cents: amountCents,
        currency: 'usd',
        supporter_name: isAnonymous ? null : supporterName || null,
        is_anonymous: !!isAnonymous,
        social_url: isAnonymous ? null : socialUrl || null,
        ip_address: ip,
        status: 'pending',
      })
      .select('id')
      .single();

    if (pendingError || !pendingBid) {
      console.error('Error reservando puja:', pendingError);
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }
    pendingBidId = pendingBid.id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Apoya a ${group.name}`,
              description: `Puja de $${(amountCents / 100).toFixed(2)}, se suma al total acumulado de ${group.name}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // Debe coincidir con PENDING_RESERVATION_MINUTES: pasado ese tiempo,
      // el tope diario ya no cuenta esta reserva, y el checkout de Stripe
      // tampoco se puede completar — quedan sincronizados.
      expires_at: Math.floor(Date.now() / 1000) + PENDING_RESERVATION_MINUTES * 60,
      metadata: { bidId: pendingBid.id },
      success_url: `${siteUrl}/?success=true`,
      cancel_url: `${siteUrl}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Error en /api/bid:', err);
    // Si alcanzamos a reservar la puja pero Stripe falló después, no la
    // dejamos "pending" para siempre — no cuenta contra el tope de nadie.
    if (pendingBidId) {
      const supabase = getSupabaseServiceClient();
      await supabase.from('bids').update({ status: 'failed' }).eq('id', pendingBidId).eq('status', 'pending');
    }
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
