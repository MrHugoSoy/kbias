import { NextRequest, NextResponse } from 'next/server';
import { stripe, BID_LIMITS } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase';

// POST /api/bid
// body: { groupId: string, amountCents: number, supporterName?: string, isAnonymous?: boolean }
//
// Flujo:
// 1. Valida límites anti-fraude (min/max por transacción). Cualquier monto
//    dentro de esos límites es válido: el trono se decide por el TOTAL
//    acumulado por grupo, no por si esta puja "supera" algo — no hay
//    mínimo dinámico que cumplir para que la puja cuente.
// 2. Crea un Stripe Checkout Session.
// 3. El registro en `bids` se crea DESPUÉS, en el webhook, solo si el
//    pago se confirma como exitoso — nunca antes, para que nadie pueda
//    sumar al total de su grupo sin haber pagado de verdad.
function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, amountCents, supporterName, isAnonymous, socialUrl } = body;

  if (!groupId || !amountCents) {
    return NextResponse.json({ error: 'Faltan datos: groupId y amountCents son requeridos' }, { status: 400 });
  }

  if (socialUrl && !isValidHttpUrl(socialUrl)) {
    return NextResponse.json({ error: 'El link de red social debe ser una URL válida (http/https)' }, { status: 400 });
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

  const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

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
    metadata: {
      groupId,
      supporterName: supporterName || '',
      isAnonymous: isAnonymous ? 'true' : 'false',
      socialUrl: !isAnonymous && socialUrl ? socialUrl : '',
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
