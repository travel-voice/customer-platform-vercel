import { createClient } from '@/lib/supabase/client';
import { PhoneNumberRecord } from '@/lib/types/phone-numbers';
import { UUID } from '@/lib/types/auth';

/**
 * Fetch phone numbers for an organisation
 */
export const getPhoneNumbers = async (organisationUuid: UUID): Promise<PhoneNumberRecord[]> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select(`
      uuid,
      phone_number,
      agent_uuid,
      agents!phone_numbers_agent_uuid_fkey (
        name,
        uuid
      )
    `)
    .eq('organization_uuid', organisationUuid)
    .eq('status', 'active');

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    uuid: item.uuid,
    phone_number: item.phone_number,
    assistant_name: item.agents?.name || null,
    assistant_uuid: item.agent_uuid || null
  }));
};

/**
 * Generate checkout link for phone number purchase
 */
export const generateCheckoutLink = async (organisationId: UUID): Promise<string> => {
  // TODO: Implement Stripe Checkout for Phone Numbers
  // This would typically call a server action or API route that creates a Stripe Session
  console.warn('Phone number checkout not yet implemented in new backend');
  throw new Error('Phone number purchasing is currently unavailable');
};

/**
 * Get details of a specific phone number
 */
export const getPhoneNumberByUuid = async (organisationUuid: UUID, phoneNumberUuid: UUID): Promise<PhoneNumberRecord> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select(`
      uuid,
      phone_number,
      agent_uuid,
      agents!phone_numbers_agent_uuid_fkey (
        name,
        uuid
      )
    `)
    .eq('organization_uuid', organisationUuid)
    .eq('uuid', phoneNumberUuid)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const agents = data.agents as any;
  return {
    uuid: data.uuid,
    phone_number: data.phone_number,
    assistant_name: agents?.name || null,
    assistant_uuid: data.agent_uuid || null
  };
};

/**
 * Update a phone number to assign it to an assistant or remove assignment (null)
 */
export const updatePhoneNumber = async (organisationUuid: UUID, phoneNumberUuid: UUID, assistantUuid: UUID | null): Promise<void> => {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('phone_numbers')
    .update({ agent_uuid: assistantUuid })
    .eq('organization_uuid', organisationUuid)
    .eq('uuid', phoneNumberUuid);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Delete a phone number from an organisation
 */
export const deletePhoneNumber = async (organisationUuid: UUID, phoneNumberUuid: UUID): Promise<void> => {
  const supabase = createClient();
  
  // Soft delete or hard delete? The original code used DELETE.
  // Let's use hard delete for now as per the policy, or update status if preferred.
  // The SQL policy allows DELETE.
  const { error } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('organization_uuid', organisationUuid)
    .eq('uuid', phoneNumberUuid);

  if (error) {
    throw new Error(error.message);
  }
};
