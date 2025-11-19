import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { message } = payload;

    if (message.type === 'end-of-call-report') {
      const { call } = message;
      
      if (!call) {
        console.error('No call data in end-of-call-report');
        return NextResponse.json({ error: 'No call data' }, { status: 400 });
      }

      const supabase = await createClient();

      // Find the agent based on vapi_assistant_id
      // Note: The call object usually contains assistantId
      const vapiAssistantId = call.assistantId;
      
      if (!vapiAssistantId) {
        console.error('No assistant ID in call data');
        return NextResponse.json({ error: 'No assistant ID' }, { status: 400 });
      }

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('uuid, organization_uuid')
        .eq('vapi_assistant_id', vapiAssistantId)
        .single();

      if (agentError || !agent) {
        console.error('Agent not found for Vapi ID:', vapiAssistantId);
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      // Insert call record
      const { error: insertError } = await supabase
        .from('calls')
        .insert({
          agent_uuid: agent.uuid,
          organization_uuid: agent.organization_uuid,
          vapi_call_id: call.id,
          duration_seconds: call.durationSeconds || 0, // Fallback if needed
          sentiment: mapSentiment(call.analysis?.sentiment),
          recording_url: call.recordingUrl,
          transcript: call.transcript || call.artifact?.transcript, // Depending on Vapi version
          extracted_data: call.analysis?.structuredData, // If using structured data
          status: call.status === 'ended' ? 'completed' : 'failed',
        });

      if (insertError) {
        console.error('Failed to insert call record:', insertError);
        return NextResponse.json({ error: 'Failed to insert call' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle other message types if needed
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapSentiment(sentimentScore: number | undefined): 'positive' | 'neutral' | 'negative' {
  if (typeof sentimentScore !== 'number') return 'neutral';
  if (sentimentScore >= 0.7) return 'positive';
  if (sentimentScore <= 0.3) return 'negative';
  return 'neutral';
}

