import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/email';
import crypto from 'crypto';

/**
 * POST /api/team/invite
 * Send an invitation to join the organization
 */
export async function POST(request: NextRequest) {
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
      .select('organization_uuid, role, first_name, last_name')
      .eq('uuid', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can invite users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite team members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'customer' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists in this organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('uuid')
      .eq('email', email.toLowerCase())
      .eq('organization_uuid', currentUser.organization_uuid)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('uuid')
      .eq('email', email.toLowerCase())
      .eq('organization_uuid', currentUser.organization_uuid)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Get organization name
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('uuid', currentUser.organization_uuid)
      .single();

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        organization_uuid: currentUser.organization_uuid,
        invited_by_uuid: user.id,
        email: email.toLowerCase(),
        role,
        token,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Send invitation email
    const origin = request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const inviteUrl = `${origin}/auth/accept-invite?token=${token}`;
    const inviterName = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    const orgName = organization?.name || 'the team';

    try {
      await resend.emails.send({
        from: 'Travel Voice <noreply@neural-voice.ai>',
        to: email.toLowerCase(),
        subject: `You've been invited to join ${orgName} on Travel Voice`,
        html: formatInvitationEmailHtml({
          inviterName,
          organizationName: orgName,
          inviteUrl,
          role,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails - the invitation is still created
      // Admin can resend or user can be told the invite link manually
    }

    return NextResponse.json({
      invitation: {
        uuid: invitation.uuid,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
      },
      inviteUrl, // Include for manual sharing if needed
    }, { status: 201 });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatInvitationEmailHtml(data: {
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
          .button:hover { background-color: #0d8bc9; }
          .role-badge { display: inline-block; background-color: #e8f4fd; color: #1AADF0; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; }
          .footer p { font-size: 13px; color: #999; margin: 0; }
          .link-fallback { word-break: break-all; font-size: 13px; color: #888; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="brand-header">
              <div class="brand-text">Travel Voice</div>
            </div>
            
            <div class="content">
              <h1>You're invited to join ${organizationName}!</h1>
              
              <p>
                <span class="highlight">${inviterName}</span> has invited you to join their team on Travel Voice, 
                the AI-powered voice assistant platform for travel businesses.
              </p>
              
              <p>
                You'll be joining as:
                <br>
                <span class="role-badge">${role === 'admin' ? 'Administrator' : 'Team Member'}</span>
              </p>
              
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
              
              <p class="link-fallback">
                Or copy and paste this link into your browser:<br>
                ${inviteUrl}
              </p>
              
              <p style="font-size: 14px; color: #888;">
                This invitation will expire in 7 days.
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

