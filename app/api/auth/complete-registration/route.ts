import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, first_name, last_name, organisation_name } = body;

    if (!user_id || !email || !first_name || !last_name || !organisation_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organisation_name,
        subscription_plan: 'free',
        time_remaining_seconds: 0,
      })
      .select()
      .single();

    if (orgError || !orgData) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // 2. Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        uuid: user_id,
        organization_uuid: orgData.uuid,
        email,
        first_name,
        last_name,
        role: 'admin', // First user in org is admin
      })
      .select()
      .single();

    if (userError || !userData) {
      console.error('Failed to create user profile:', userError);
      // Rollback: delete organization
      await supabase.from('organizations').delete().eq('uuid', orgData.uuid);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        uuid: userData.uuid,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organisation_uuid: userData.organization_uuid,
        role: userData.role,
        avatar: userData.avatar,
        is_verified: false, // Will be true after email confirmation
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Registration completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
