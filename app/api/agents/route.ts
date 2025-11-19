import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';

/**
 * GET /api/agents
 * List all agents for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all agents for this organization
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_uuid', userData.organization_uuid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents
 * Create a new agent and sync with Vapi
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, image, voice_id, first_message, system_prompt } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine the server URL for webhooks
    const origin = request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const serverUrl = `${origin}/api/vapi/webhook`;

    // 1. Create assistant in Vapi
    const vapiAssistant = await vapiClient.createAssistant({
      name,
      firstMessage: first_message,
      systemPrompt: system_prompt,
      voiceId: voice_id,
      serverUrl,
    });

    // 2. Create agent in database
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        organization_uuid: userData.organization_uuid,
        name,
        image,
        voice_id,
        first_message,
        system_prompt,
        vapi_assistant_id: vapiAssistant.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      // Rollback: delete Vapi assistant
      try {
        await vapiClient.deleteAssistant(vapiAssistant.id);
      } catch (e) {
        console.error('Failed to rollback Vapi assistant:', e);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: any) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
