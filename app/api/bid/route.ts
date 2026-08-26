import { NextRequest, NextResponse } from 'next/server';
import { stripe, BID_LIMITS } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase';

// POST /api/bid
// body: { groupId: string, amountCents: number, supporterName?: string, isAnonymous?: boolean }
//
// Flujo:
// 1. Valida que el monto sea mayor a la puja actual (current_throne) + $1.
// 2. Valida límites anti-fraude (min/max por transacción).
// 3. Crea un Stripe Checkout Session.
// 4. El registro en `bids` se crea DESPUÉS, en el webhook, solo si el
//    pago se confirma como exitoso — nunca antes, para que nadie pueda
//    "reclamar el trono" sin haber pagado de verdad.
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

  // Verifica que el monto realmente supere el trono actual
  const { data: throne } = await supabase.from('current_throne').select('*').maybeSingle();
  if (throne && amountCents <= throne.amount_cents) {
    return NextResponse.json(
      { error: `Tu puja debe ser mayor a $${(throne.amount_cents / 100).toFixed(2)}, el monto actual del trono.` },
      { status: 400 }
    );
  }

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
            name: `Reclama el #1 para ${group.name}`,
            description: `Puja de $${(amountCents / 100).toFixed(2)} para tomar el trono`,
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
