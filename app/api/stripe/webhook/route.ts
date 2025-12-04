import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { STRIPE_PLANS } from '@/lib/constants/plans';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = createAdminClient();
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const organizationUuid = session.metadata?.organization_uuid;
          const planId = session.metadata?.plan_id;

          if (organizationUuid && planId) {
            const plan = STRIPE_PLANS.find(p => p.id === planId);
            if (plan) {
                // Top up minutes for the new subscription immediately or set initial state
                // Note: Usually subscription.created handles this, but if it's a one-time payment or we want immediate effect
                await supabase
                    .from('organizations')
                    .update({
                        subscription_plan: plan.name,
                        stripe_subscription_id: session.subscription as string,
                        subscription_status: 'active',
                        // Reset/Add minutes. For simplicity, we reset to plan limit on new sub
                        time_remaining_seconds: plan.minutesIncluded * 60 
                    })
                    .eq('uuid', organizationUuid);
            }
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const status = subscription.status;
          const customerId = subscription.customer as string;
          
          // We need to find the org by customer ID if metadata isn't on subscription object directly
          // Stripe copies metadata from Checkout Session to Subscription usually if configured, 
          // but good to look up by customer_id as fallback
          
          await supabase
            .from('organizations')
            .update({ 
                subscription_status: status,
                stripe_subscription_id: subscription.id
            })
            .eq('stripe_customer_id', customerId);
            
            // If it's a renewal (invoice.payment_succeeded) we might want to top up minutes
            // But that is a different event. 
            // For now, rely on checkout completion for initial setup.
            // Todo: Handle recurring minute top-up on invoice.payment_succeeded
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          await supabase
            .from('organizations')
            .update({ 
                subscription_status: 'canceled',
                subscription_plan: 'free' // Revert to free or null
            })
            .eq('stripe_customer_id', customerId);
          break;
        }
      }
    } catch (error) {
      console.error('Webhook handler error:', error);
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

