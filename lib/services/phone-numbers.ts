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
 * Search available phone numbers
 */
export const searchPhoneNumbers = async (countryCode: string = 'US', areaCode?: string) => {
    const params = new URLSearchParams({
        countryCode,
        limit: '10'
    });
    if (areaCode) params.append('areaCode', areaCode);

    const response = await fetch(`/api/phone-numbers/search?${params.toString()}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search phone numbers');
    }
    return response.json();
}

/**
 * Buy a phone number
 */
export const buyPhoneNumber = async (phoneNumber: string, assistantId?: string) => {
    const response = await fetch('/api/phone-numbers/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, assistantId })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase phone number');
    }
    return response.json();
}

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
    const response = await fetch(`/api/phone-numbers/${phoneNumberUuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId: assistantUuid })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update phone number');
    }
};

/**
 * Delete a phone number from an organisation
 */
export const deletePhoneNumber = async (organisationUuid: UUID, phoneNumberUuid: UUID): Promise<void> => {
    const response = await fetch(`/api/phone-numbers/${phoneNumberUuid}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete phone number');
    }
};
