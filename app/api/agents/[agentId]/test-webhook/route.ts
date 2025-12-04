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
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('uuid, organization_uuid, name, custom_webhook_url')
      .eq('uuid', agentId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.custom_webhook_url) {
      return NextResponse.json({ error: 'No webhook URL configured for this agent' }, { status: 400 });
    }

    // Create mock payload
    const mockPayload = {
      message: {
        type: "end-of-call-report",
        call: {
          id: "test-call-id-" + Date.now(),
          assistantId: "test-assistant-id",
          customer: {
            number: "+15550001234"
          },
          status: "completed",
          startedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          endedAt: new Date().toISOString(),
          durationSeconds: 60,
        },
        analysis: {
          summary: "This is a test call summary. The user asked about pricing and the agent provided the information.",
          sentiment: "positive"
        },
        transcript: "Agent: Hello, how can I help you today?\nUser: I'd like to know about your pricing.\nAgent: Our pricing starts at $10/month.",
        recordingUrl: "https://example.com/recording.mp3",
        durationSeconds: 60,
        cost: 0.05,
        artifact: {
          structuredData: [
            {
              "customer_intent": "pricing_inquiry",
              "satisfaction_score": 5
            }
          ]
        }
      },
      timestamp: new Date().toISOString()
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
        body: JSON.stringify(mockPayload),
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
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

