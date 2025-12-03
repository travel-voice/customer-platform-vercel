import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/team/invitations/[invitationId]
 * Cancel a pending invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
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

    // Only admins can cancel invitations
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can cancel invitations' }, { status: 403 });
    }

    // Get the invitation
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('uuid, organization_uuid, status')
      .eq('uuid', invitationId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Ensure invitation is in the same organization
    if (invitation.organization_uuid !== currentUser.organization_uuid) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Only cancel pending invitations
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending invitations' }, { status: 400 });
    }

    // Update invitation status to cancelled
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('uuid', invitationId);

    if (updateError) {
      console.error('Error cancelling invitation:', updateError);
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/invitations/[invitationId]/resend
 * Resend an invitation email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's organization and role
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_uuid, role, first_name, last_name')
      .eq('uuid', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can resend invitations
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can resend invitations' }, { status: 403 });
    }

    // Get the invitation
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('uuid', invitationId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Ensure invitation is in the same organization
    if (invitation.organization_uuid !== currentUser.organization_uuid) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Only resend pending invitations
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 });
    }

    // Get organization name
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('uuid', currentUser.organization_uuid)
      .single();

    // Import and send email
    const { resend } = await import('@/lib/email');
    const origin = request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const inviteUrl = `${origin}/auth/accept-invite?token=${invitation.token}`;
    const inviterName = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    const orgName = organization?.name || 'the team';

    await resend.emails.send({
      from: 'Travel Voice <noreply@travelvoice.co.uk>',
      to: invitation.email,
      subject: `Reminder: You've been invited to join ${orgName} on Travel Voice`,
      html: formatResendEmailHtml({
        inviterName,
        organizationName: orgName,
        inviteUrl,
        role: invitation.role,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatResendEmailHtml(data: {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}) {
  const { inviterName, organizationName, inviteUrl, role } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .brand-header { text-align: center; margin-bottom: 30px; }
          .brand-text { color: #1AADF0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px; }
          .content { text-align: center; }
          h1 { font-size: 24px; font-weight: 600; margin: 0 0 20px 0; color: #111; }
          p { color: #555; margin: 0 0 20px 0; font-size: 16px; }
          .highlight { color: #1AADF0; font-weight: 600; }
          .button { display: inline-block; background-color: #1AADF0; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .reminder-badge { display: inline-block; background-color: #fef3cd; color: #856404; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; }
          .footer p { font-size: 13px; color: #999; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="brand-header">
              <div class="brand-text">Travel Voice</div>
            </div>
            
            <div class="content">
              <span class="reminder-badge">⏰ Reminder</span>
              
              <h1>Your invitation is still waiting!</h1>
              
              <p>
                <span class="highlight">${inviterName}</span> invited you to join 
                <span class="highlight">${organizationName}</span> on Travel Voice.
              </p>
              
              <p>
                Click below to accept and get started as a ${role === 'admin' ? 'Administrator' : 'Team Member'}.
              </p>
              
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
              
              <p style="font-size: 14px; color: #888;">
                This invitation will expire in 7 days from the original invite.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Travel Voice. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

