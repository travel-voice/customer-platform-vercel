import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';
import twilio from 'twilio';
import { stripe } from '@/lib/stripe';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId } = await req.json();
    const phoneNumberUuid = params.id;

    // Verify ownership and get details
    const { data: phoneRecord, error: fetchError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('uuid', phoneNumberUuid)
      .single();

    if (fetchError || !phoneRecord) {
        return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Check organization
    const { data: userData } = await supabase
        .from('users')
        .select('organization_uuid')
        .eq('uuid', user.id)
        .single();
    
    if (phoneRecord.organization_uuid !== userData?.organization_uuid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update Vapi
    if (phoneRecord.provider_id) {
      await vapiClient.updatePhoneNumber(phoneRecord.provider_id, {
        assistantId: assistantId || null,
      });
    }

    // Update Database
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update({ agent_uuid: assistantId || null })
      .eq('uuid', phoneNumberUuid);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update phone number error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumberUuid = params.id;

     // Verify ownership and get details
     const { data: phoneRecord, error: fetchError } = await supabase
     .from('phone_numbers')
     .select('*')
     .eq('uuid', phoneNumberUuid)
     .single();

   if (fetchError || !phoneRecord) {
       return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
   }

   // Check organization
   const { data: userData } = await supabase
       .from('users')
       .select('organization_uuid')
       .eq('uuid', user.id)
       .single();
   
   if (phoneRecord.organization_uuid !== userData?.organization_uuid) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }

   // Intelligent Deletion & Reconciliation
   // 1. Determine if the deleted number was "Paid" (has Stripe ID) or "Free" (no Stripe ID)
   const wasPaid = !!phoneRecord.stripe_subscription_item_id;

   if (wasPaid) {
       // Case A: Deleting a Paid Number
       // Simply remove the Stripe item. No other reconciliation needed.
       try {
           await stripe.subscriptionItems.del(phoneRecord.stripe_subscription_item_id);
       } catch (e) {
           console.error('Error removing Stripe subscription item:', e);
       }
   } else {
       // Case B: Deleting a Free Number
       // We need to check if there are any "Paid" numbers that should now become "Free"
       // to fill the slot opened by this deletion.
       
       // Find one paid number for this org
       if (userData?.organization_uuid) {
           const { data: paidNumbers } = await supabase
               .from('phone_numbers')
               .select('*')
               .eq('organization_uuid', userData.organization_uuid)
               .not('stripe_subscription_item_id', 'is', null)
               .limit(1); // Just get one

           if (paidNumbers && paidNumbers.length > 0) {
               const paidNumberToFree = paidNumbers[0];
               
               // 1. Cancel billing for this number
               try {
                   await stripe.subscriptionItems.del(paidNumberToFree.stripe_subscription_item_id);
                   
                   // 2. Update DB to mark it as free
                   await supabase
                       .from('phone_numbers')
                       .update({ stripe_subscription_item_id: null })
                       .eq('uuid', paidNumberToFree.uuid);
                       
               } catch (e) {
                   console.error('Error reconciling paid number to free slot:', e);
               }
           }
       }
   }

    // 2. Delete from Vapi
    if (phoneRecord.provider_id) {
        try {
            await vapiClient.deletePhoneNumber(phoneRecord.provider_id);
        } catch (e) {
            console.error('Error deleting from Vapi:', e);
        }
    }

    // 3. Release from Twilio
    if (phoneRecord.phone_number) {
        try {
            const incomingNumbers = await twilioClient.incomingPhoneNumbers.list({
                phoneNumber: phoneRecord.phone_number
            });
            if (incomingNumbers && incomingNumbers.length > 0) {
                await twilioClient.incomingPhoneNumbers(incomingNumbers[0].sid).remove();
            }
        } catch (e) {
            console.error('Error releasing Twilio number:', e);
        }
    }

    // 4. Delete from DB
    const { error: deleteError } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('uuid', phoneNumberUuid);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete phone number error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
