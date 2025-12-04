import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { STRIPE_PLANS } from '@/lib/constants/plans';

export async function POST(req: NextRequest) {
  try {
    const { priceId, planId } = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization details
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData?.organization_uuid) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('uuid', userData.organization_uuid)
      .single();

    let customerId = org?.stripe_customer_id;

    // Create Stripe customer if it doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_uuid: userData.organization_uuid,
          user_uuid: user.id,
        },
      });
      customerId = customer.id;

      // Update organization with Stripe customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('uuid', userData.organization_uuid);
    }

    // Validate plan
    const plan = STRIPE_PLANS.find((p) => p.id === planId);
    if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    
    // Fallback to env var if priceId from client is not trusted/missing, 
    // but for now we assume the client sends the correct ID from the constants or we lookup here.
    // Ideally we use the constant's ID.
    const stripePriceId = plan.stripePriceId || priceId; 

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.travelvoice.co.uk'}/payment?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.travelvoice.co.uk'}/payment?canceled=true`,
      subscription_data: {
        metadata: {
            organization_uuid: userData.organization_uuid,
            plan_id: planId
        }
      },
      metadata: {
        organization_uuid: userData.organization_uuid,
        plan_id: planId
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

