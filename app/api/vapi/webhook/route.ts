import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Log the full payload for debugging
    console.log('Vapi webhook received:', JSON.stringify(payload, null, 2));
    
    const { message } = payload;

    if (message?.type === 'end-of-call-report') {
      const { call } = message;
      
      if (!call) {
        console.error('No call data in end-of-call-report');
        return NextResponse.json({ error: 'No call data' }, { status: 400 });
      }

      // Log call object to see what fields are available
      console.log('Call object keys:', Object.keys(call));
      console.log('Call assistant info:', {
        assistantId: call.assistantId,
        assistant: call.assistant,
        assistantUuid: call.assistantUuid,
      });

      const supabase = await createClient();

      // Find the agent based on vapi_assistant_id
      // Try multiple possible field names
      const vapiAssistantId = call.assistantId || call.assistant?.id || call.assistant;
      
      if (!vapiAssistantId) {
        console.error('No assistant ID in call data. Call object:', JSON.stringify(call, null, 2));
        return NextResponse.json({ error: 'No assistant ID' }, { status: 400 });
      }

      console.log('Looking up agent with Vapi ID:', vapiAssistantId);

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('uuid, organization_uuid')
        .eq('vapi_assistant_id', vapiAssistantId)
        .single();

      if (agentError || !agent) {
        console.error('Agent not found for Vapi ID:', vapiAssistantId);
        console.error('Supabase error:', agentError);
        
        // Log all agents to help debug
        const { data: allAgents } = await supabase
          .from('agents')
          .select('name, vapi_assistant_id');
        console.log('All agents in database:', allAgents);
        
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      console.log('Found agent:', agent);

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

