import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * DELETE /api/team/members/[userId]
 * Remove a team member from the organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's organization and role
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_uuid, role')
      .eq('uuid', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can remove users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can remove team members' }, { status: 403 });
    }

    // Can't remove yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the organization' }, { status: 400 });
    }

    // Get the target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('uuid, organization_uuid, email')
      .eq('uuid', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure target user is in the same organization
    if (targetUser.organization_uuid !== currentUser.organization_uuid) {
      return NextResponse.json({ error: 'User is not in your organization' }, { status: 403 });
    }

    // Use admin client to delete user from auth and users table
    const adminSupabase = createAdminClient();

    // Delete user profile first (this will cascade, but let's be explicit)
    const { error: deleteProfileError } = await adminSupabase
      .from('users')
      .delete()
      .eq('uuid', userId);

    if (deleteProfileError) {
      console.error('Error deleting user profile:', deleteProfileError);
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
    }

    // Delete user from Supabase Auth
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // User profile is already deleted, so log but don't fail
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/members/[userId]
 * Update a team member's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's organization and role
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_uuid, role')
      .eq('uuid', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can update roles
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update team member roles' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('uuid, organization_uuid')
      .eq('uuid', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure target user is in the same organization
    if (targetUser.organization_uuid !== currentUser.organization_uuid) {
      return NextResponse.json({ error: 'User is not in your organization' }, { status: 403 });
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('uuid', userId)
      .select('uuid, email, first_name, last_name, role')
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

