import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/home';

  if (code) {
    const supabase = await createClient();

    // Exchange code for session (handles both OAuth and email confirmation)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${error.message}`);
    }

    // Check if user profile exists in our users table
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', user.id)
        .single();

      // If user has profile, redirect to home (normal flow)
      if (userData && !userError) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }

      // If user doesn't have a profile yet (OAuth first-time login)
      // Create their organization and user record
      if (userError || !userData) {
        // For OAuth users, create org and profile with metadata
        const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
        const lastName = user.user_metadata?.last_name || '';

        // Create organization
        const { data: orgData } = await supabase
          .from('organizations')
          .insert({
            name: `${firstName}'s Organization`,
            subscription_plan: 'free',
            time_remaining_seconds: 0,
          })
          .select()
          .single();

        if (orgData) {
          // Create user profile
          await supabase
            .from('users')
            .insert({
              uuid: user.id,
              organization_uuid: orgData.uuid,
              email: user.email!,
              first_name: firstName,
              last_name: lastName,
              role: 'admin',
            });
        }
      }
    }
  }

  // Redirect to home after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
