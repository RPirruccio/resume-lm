// src/app/api/webhooks/stripe/route.ts

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function handleSubscriptionChange(
  stripeCustomerId: string,
  subscriptionData: {
    subscriptionId: string;
    planId: string;
    status: 'active' | 'canceled';
    currentPeriodEnd: Date;
    trialEnd?: Date | null;
  }
) {
  // Log the subscription change
  console.log('📝 Processing subscription change:', {
    customerId: stripeCustomerId,
    ...subscriptionData
  });

  // TODO: Implement your database update logic here
  
  console.log('✅ Subscription change processed');
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const idempotencyKey = (await headers()).get('stripe-idempotency-key');
    if (idempotencyKey) {
      console.log('📦 Processing webhook with idempotency key:', idempotencyKey);
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const error = err as Error
      console.error(`⚠️ Webhook signature verification failed: ${error.message}`)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await handleSubscriptionChange(
            session.customer as string,
            {
              subscriptionId: subscription.id,
              planId: subscription.items.data[0].price.id,
              status: 'active',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            }
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          await handleSubscriptionChange(
            invoice.customer as string,
            {
              subscriptionId: subscription.id,
              planId: subscription.items.data[0].price.id,
              status: 'active',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await handleSubscriptionChange(
          subscription.customer as string,
          {
            subscriptionId: subscription.id,
            planId: subscription.items.data[0].price.id,
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await handleSubscriptionChange(
          subscription.customer as string,
          {
            subscriptionId: subscription.id,
            planId: 'free',
            status: 'canceled',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEnd: null
          }
        );
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('🔥 Webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
