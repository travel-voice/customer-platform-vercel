import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/agents/[agentId]/test-webhook
 * 
 * Sends a test webhook payload to the agent's configured webhook URL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
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

    // Get the agent to verify ownership and get webhook URL
    const { data: agents, error: fetchError } = await supabase
      .from('agents')
      .select('uuid, organization_uuid, name, custom_webhook_url')
      .eq('uuid', agentId)
      .eq('organization_uuid', userData.organization_uuid);

    if (fetchError || !agents || agents.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];

    if (!agent.custom_webhook_url) {
      return NextResponse.json({ error: 'No webhook URL configured for this agent' }, { status: 400 });
    }

    // Create simplified hardcoded test payload
    const customerPayload = {
      assistant_name: "Test Assistant",
      summary: "The user called to test the webhook integration. The AI confirmed the configuration was correct. The user ended the call.",
      transcript: "AI: Hello, how can I help you today?\nUser: I'm just testing the webhook integration.\nAI: Understood. I can confirm the webhook is configured correctly. Is there anything else?\nUser: No, that's all. Goodbye.\nAI: Have a great day!",
      extracted_data: {
         "test_status": "success",
         "integration_verified": true
      }
    };

    console.log(`Sending test webhook to ${agent.custom_webhook_url}`);

    // Send request to customer endpoint
    try {
      const response = await fetch(agent.custom_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-UUID': agent.uuid,
          'X-Organization-UUID': agent.organization_uuid,
          'X-Event-Type': 'test_webhook'
        },
        body: JSON.stringify(customerPayload),
      });

      const success = response.ok;
      const status = response.status;
      const responseText = await response.text().catch(() => '');

      return NextResponse.json({
        success,
        status,
        responseText: responseText.substring(0, 500) // Limit response size
      });
    } catch (error: any) {
      console.error('Test webhook failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to connect to webhook URL'
      });
    }

  } catch (error: any) {
    // The "JSON object" error usually happens when .single() is called but multiple or no rows are found,
    // OR when the supabase client encounters an unexpected response structure (like HTML instead of JSON).
    // In this case, it's likely coming from one of the .single() calls if data is missing/ambiguous,
    // OR it could be the fetch() to the customer URL returning non-JSON if we were parsing it as JSON (which we aren't).
    
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
