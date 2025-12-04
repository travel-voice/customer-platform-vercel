import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agents/[agentId]/test-webhook
 * 
 * Sends a test webhook payload to test the customer's endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
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

    console.log(`Sending test webhook to ${webhookUrl}`);

    // Send request to customer endpoint
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
