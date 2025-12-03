import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/team
 * List all team members and pending invitations for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and role
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_uuid, role')
      .eq('uuid', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('uuid, name')
      .eq('uuid', currentUser.organization_uuid)
      .single();

    // Get all team members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('uuid, email, first_name, last_name, role, avatar, created_at')
      .eq('organization_uuid', currentUser.organization_uuid)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('uuid, email, role, status, created_at, expires_at, invited_by_uuid')
      .eq('organization_uuid', currentUser.organization_uuid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      // Don't fail if invitations table doesn't exist yet
    }

    return NextResponse.json({
      organization,
      members: members || [],
      invitations: invitations || [],
      currentUserRole: currentUser.role,
      currentUserId: user.id,
    });
  } catch (error: any) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

