import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';

// POST /api/webhook — configúralo en el dashboard de Stripe apuntando aquí.
// La fila en `bids` ya existe desde /api/bid (status='pending'); este
// webhook solo la CONFIRMA o la DESCARTA según lo que diga Stripe. Nunca
// inserta una fila nueva, así que reintentos del mismo evento (Stripe
// reintenta automáticamente si no respondemos 2xx) son inofensivos: la
// segunda vez simplemente vuelve a marcar la misma fila con el mismo
// resultado, en vez de fallar por una constraint de duplicado.
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

  const supabase = getSupabaseServiceClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bidId = session.metadata?.bidId;

    if (!bidId) {
      console.error('Webhook sin bidId en metadata');
      return NextResponse.json({ error: 'Falta bidId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bids')
      .update({
        status: 'succeeded',
        amount_cents: session.amount_total ?? undefined,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', bidId);

    if (error) {
      console.error('Error confirmando puja:', error);
      return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 });
    }
  } else if (event.type === 'checkout.session.expired') {
    // El usuario no completó el pago a tiempo — libera la reserva.
    // (Requiere que "checkout.session.expired" esté habilitado como
    // evento en el webhook de Stripe; si no lo está, la fila se queda en
    // 'pending' pero deja de contar contra el tope diario después de los
    // 30 minutos de todas formas, así que no hay impacto en el ranking.)
    const session = event.data.object as Stripe.Checkout.Session;
    const bidId = session.metadata?.bidId;
    if (bidId) {
      await supabase.from('bids').update({ status: 'failed' }).eq('id', bidId).eq('status', 'pending');
    }
  }

  return NextResponse.json({ received: true });
}
