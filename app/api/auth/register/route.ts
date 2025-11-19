import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, organisation_name } = body;

    if (!email || !password || !first_name || !last_name || !organisation_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create auth user (with email confirmation required)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // 2. Create organization
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
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // 3. Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        uuid: authData.user.id,
        organization_uuid: orgData.uuid,
        email,
        first_name,
        last_name,
        role: 'admin', // First user in org is admin
      })
      .select()
      .single();

    if (userError || !userData) {
      // Rollback: delete auth user and organization
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('organizations').delete().eq('uuid', orgData.uuid);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 4. Supabase automatically sends a confirmation email with a link
    // when email_confirm is set to false. No additional action needed.

    return NextResponse.json({
      user: {
        uuid: userData.uuid,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organisation_uuid: userData.organization_uuid,
        role: userData.role,
        avatar: userData.avatar,
        is_verified: false,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
