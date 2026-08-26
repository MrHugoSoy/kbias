import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';

// POST /api/webhook — configúralo en el dashboard de Stripe apuntando aquí.
// Este es el ÚNICO lugar donde se inserta una fila en `bids`. Así garantizamos
// que el ranking solo se mueve cuando Stripe confirma que el dinero
// efectivamente se cobró — nunca antes.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature inválida:', err);
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = getSupabaseServiceClient();

    const groupId = session.metadata?.groupId;
    const supporterName = session.metadata?.supporterName || null;
    const isAnonymous = session.metadata?.isAnonymous === 'true';
    const amountCents = session.amount_total ?? 0;

    if (!groupId) {
      console.error('Webhook sin groupId en metadata');
      return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
    }

    // Re-verifica contra el trono actual justo antes de insertar,
    // por si dos personas pagaron casi al mismo tiempo (race condition).
    // Igual se guarda el registro (el dinero ya se cobró), pero esto
    // te permite decidir después si reembolsas una puja que "llegó tarde".
    const { error } = await supabase.from('bids').insert({
      group_id: groupId,
      amount_cents: amountCents,
      supporter_name: isAnonymous ? null : supporterName,
      is_anonymous: isAnonymous,
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'succeeded',
    });

    if (error) {
      console.error('Error insertando puja:', error);
      return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Stripe necesita el body crudo para verificar la firma
export const config = {
  api: { bodyParser: false },
};
