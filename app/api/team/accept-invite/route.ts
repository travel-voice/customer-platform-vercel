import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/team/accept-invite?token=xxx
 * Validate an invitation token
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the invitation
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        uuid,
        email,
        role,
        status,
        expires_at,
        organization_uuid,
        organizations (
          name
        )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('uuid', invitation.uuid);
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation has already been ${invitation.status}` }, { status: 400 });
    }

    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('users')
      .select('uuid')
      .eq('email', invitation.email)
      .single();

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: (invitation.organizations as any)?.name || 'Unknown',
      },
      userExists: !!existingUser,
    });
  } catch (error: any) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/accept-invite
 * Accept an invitation and join the organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, first_name, last_name } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('uuid', invitation.uuid);
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation has already been ${invitation.status}` }, { status: 400 });
    }

    // Check if user already exists with this email
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const authUser = existingAuthUser?.users?.find(u => u.email === invitation.email);

    let userId: string;

    if (authUser) {
      // User exists in auth - check if they have a profile
      const { data: existingProfile } = await supabase
        .from('users')
        .select('uuid, organization_uuid')
        .eq('uuid', authUser.id)
        .single();

      if (existingProfile) {
        // User already has a profile - they need to be moved to new org
        // For security, we don't allow this automatically
        return NextResponse.json({ 
          error: 'This email is already associated with another organization. Please contact support.' 
        }, { status: 400 });
      }

      userId = authUser.id;
    } else {
      // Create new auth user
      if (!password || !first_name || !last_name) {
        return NextResponse.json({ 
          error: 'Password, first name, and last name are required for new users' 
        }, { status: 400 });
      }

      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true, // Auto-confirm since they came from invite link
        user_metadata: {
          first_name,
          last_name,
        },
      });

      if (authError || !newAuthUser.user) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 });
      }

      userId = newAuthUser.user.id;
    }

    // Create user profile in the organization
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        uuid: userId,
        organization_uuid: invitation.organization_uuid,
        email: invitation.email,
        first_name: first_name || invitation.email.split('@')[0],
        last_name: last_name || '',
        role: invitation.role,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If profile creation fails and we just created the auth user, clean up
      if (!authUser) {
        await supabase.auth.admin.deleteUser(userId);
      }
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // Mark invitation as accepted
    await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('uuid', invitation.uuid);

    return NextResponse.json({ 
      success: true,
      message: 'Invitation accepted successfully',
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

