import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';
import twilio from 'twilio';
import { stripe } from '@/lib/stripe';
import { STRIPE_PRICE_ID_PHONE_NUMBER, STRIPE_PLANS } from '@/lib/constants/plans';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization and Stripe details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        organization_uuid,
        organizations!users_organization_uuid_fkey (
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status,
          subscription_plan
        )
      `)
      .eq('uuid', user.id)
      .single();

    if (userError || !userData?.organization_uuid) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organization = userData.organizations as any;
    const organizationUuid = userData.organization_uuid;

    // Check for active subscription
    if (!organization.stripe_subscription_id || organization.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required. Please upgrade your plan to purchase phone numbers.' },
        { status: 400 }
      );
    }

    if (!STRIPE_PRICE_ID_PHONE_NUMBER) {
        return NextResponse.json(
            { error: 'Phone number pricing not configured.' },
            { status: 500 }
        );
    }

    const body = await req.json();
    const { phoneNumber, assistantId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // --- Quota Check Start ---
    // 1. Determine Plan Limits
    // The subscription_plan field usually stores the plan name (e.g., "Standard"). 
    // We map this to our constants.
    const planName = organization.subscription_plan; 
    const planDetails = STRIPE_PLANS.find(p => p.name === planName);
    
    // Default to 0 included if plan not found (fallback)
    const includedNumbers = planDetails?.phoneNumbersIncluded || 0;

    // 2. Count Existing Numbers
    const { count: existingCount, error: countError } = await supabase
        .from('phone_numbers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_uuid', organizationUuid)
        .eq('status', 'active'); // Only count active numbers

    if (countError) {
        console.error('Error counting phone numbers:', countError);
        return NextResponse.json({ error: 'Failed to verify phone number usage' }, { status: 500 });
    }

    const currentCount = existingCount || 0;
    const needsPayment = currentCount >= includedNumbers;

    // --- Quota Check End ---

    // 1. Add Subscription Item to Stripe (ONLY if over quota)
    let subscriptionItem;
    if (needsPayment) {
        try {
            subscriptionItem = await stripe.subscriptionItems.create({
                subscription: organization.stripe_subscription_id,
                price: STRIPE_PRICE_ID_PHONE_NUMBER,
                quantity: 1,
                metadata: {
                    phoneNumber: phoneNumber,
                    organization_uuid: organizationUuid
                }
            });
        } catch (stripeError: any) {
            console.error('Stripe subscription error:', stripeError);
            return NextResponse.json(
                { error: `Failed to update subscription: ${stripeError.message}` },
                { status: 500 }
            );
        }
    }

    // 2. Buy number from Twilio
    let twilioNumber;
    try {
      twilioNumber = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        // Optional: Configure Voice URL here if Vapi doesn't do it automatically
        // voiceUrl: 'https://phone.vapi.ai/twilio-voice', 
      });
    } catch (twilioError: any) {
      console.error('Twilio purchase error:', twilioError);
      
      // Rollback Stripe Charge if we charged
      if (subscriptionItem) {
          try {
            await stripe.subscriptionItems.del(subscriptionItem.id);
          } catch (rollbackError) {
            console.error('Failed to rollback Stripe subscription item:', rollbackError);
          }
      }

      return NextResponse.json(
        { error: `Failed to purchase number from Twilio: ${twilioError.message}` },
        { status: 500 }
      );
    }

    // 3. Import to Vapi
    let vapiNumber;
    try {
      vapiNumber = await vapiClient.importTwilioPhoneNumber({
        provider: 'twilio',
        number: twilioNumber.phoneNumber,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
        assistantId: assistantId || undefined,
      });
    } catch (vapiError: any) {
      console.error('Vapi import error:', vapiError);
      
      // Rollback Twilio & Stripe
      try {
          await twilioClient.incomingPhoneNumbers(twilioNumber.sid).remove();
          if (subscriptionItem) {
            await stripe.subscriptionItems.del(subscriptionItem.id);
          }
      } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
      }
      
      return NextResponse.json(
        { error: `Failed to import number to Vapi: ${vapiError.message}` },
        { status: 500 }
      );
    }

    // 4. Save to Supabase
    const { error: dbError } = await supabase
      .from('phone_numbers')
      .insert({
        organization_uuid: organizationUuid,
        agent_uuid: assistantId || null,
        phone_number: twilioNumber.phoneNumber,
        provider: 'twilio',
        provider_id: vapiNumber.id, // Store Vapi ID as reference
        stripe_subscription_item_id: subscriptionItem ? subscriptionItem.id : null,
        status: 'active',
      });

    if (dbError) {
      console.error('Database save error:', dbError);
      // This is critical - we charged them but failed to save. 
      // Ideally we would rollback everything or alert admin.
      // For now, returning error but the number is provisioned.
      return NextResponse.json(
        { error: 'Failed to save phone number to database. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: twilioNumber.phoneNumber,
      vapiId: vapiNumber.id,
      isPaid: !!subscriptionItem
    });

  } catch (error: any) {
    console.error('Phone number purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
