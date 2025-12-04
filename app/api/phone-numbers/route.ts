import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/phone-numbers
 * 
 * Fetch all phone numbers for the authenticated user's organization
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (orgError || !userData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch phone numbers for the organization
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from('phone_numbers')
      .select(`
        uuid,
        phone_number,
        agent_uuid,
        status,
        provider_id,
        created_at
      `)
      .eq('organization_uuid', userData.organization_uuid)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (phoneError) {
      console.error('Error fetching phone numbers:', phoneError);
      return NextResponse.json(
        { error: 'Failed to fetch phone numbers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      phoneNumbers: phoneNumbers || [],
    });
  } catch (error: any) {
    console.error('Phone numbers API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

