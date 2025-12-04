import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resend, formatCallEmailHtml } from '@/lib/email';

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

      const supabase = createAdminClient();

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
        .select('uuid, organization_uuid, name, advanced_config, custom_webhook_url')
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

      const transcriptText =
        message.transcript ||
        message.artifact?.transcript ||
        null;

      const summary =
        message.summary ||
        message.analysis?.summary ||
        null;

      const callUrl =
        message.artifact?.variables?.transport?.callUrl ||
        message.artifact?.variableValues?.transport?.callUrl ||
        call.transport?.callUrl ||
        call.webCallUrl ||
        null;

      const recordingUrl =
        message.recordingUrl ||
        message.artifact?.recording?.mono?.combinedUrl ||
        message.artifact?.recording?.stereoUrl ||
        message.stereoRecordingUrl ||
        null;

      // Extract structured data from Vapi's structured output
      // This will be in message.artifact.structuredData as an array
      const structuredData = message.artifact?.structuredData?.[0] || null;
      
      console.log('Structured data extracted:', structuredData ? 'Yes' : 'No');
      if (structuredData) {
        console.log('Structured data keys:', Object.keys(structuredData));
        console.log('Structured data sample:', JSON.stringify(structuredData, null, 2));
      }

      // Send webhook to customer endpoint if configured
      if (agent.custom_webhook_url) {
        console.log(`Sending webhook to customer endpoint: ${agent.custom_webhook_url}`);

        // Construct simplified payload
        const customerPayload = {
            assistant_name: agent.name,
            summary: summary || "No summary available",
            transcript: transcriptText || "No transcript available",
            extracted_data: structuredData || {}
        };
        
        // Fire and forget
        fetch(agent.custom_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-UUID': agent.uuid,
            'X-Organization-UUID': agent.organization_uuid,
          },
          body: JSON.stringify(customerPayload),
        })
        .then(res => {
          console.log(`Customer webhook response: ${res.status}`);
          if (!res.ok) {
            console.error(`Customer webhook failed with status ${res.status}`);
          }
        })
        .catch(err => {
          console.error('Error sending customer webhook:', err);
        });
      }

      // Prepare call details
      const durationSeconds = Math.round(
        message.durationSeconds ??
        message.durationMs
          ? message.durationMs / 1000
          : call.durationSeconds ??
            call.durationMinutes
              ? call.durationMinutes * 60
              : 0
      );

      const transcriptMessages =
        message.artifact?.messages ||
        message.messages ||
        [];

      const extractedData = {
        summary,
        transcriptText,
        structuredData, // Add the structured data here
        analysis: message.analysis,
        logUrl: message.logUrl,
        recording: message.artifact?.recording,
        recordingUrl,
        stereoRecordingUrl: message.stereoRecordingUrl,
        callUrls: {
          callUrl,
          webCallUrl: call.webCallUrl,
          monitor: call.monitor,
        },
        messagesOpenAIFormatted: message.artifact?.messagesOpenAIFormatted,
        variables: message.artifact?.variables,
        variableValues: message.artifact?.variableValues,
        performanceMetrics: message.artifact?.performanceMetrics,
        scorecards: message.artifact?.scorecards,
        transfers: message.artifact?.transfers,
        costs: message.costs,
        costBreakdown: message.costBreakdown,
        startedAt: message.startedAt,
        endedAt: message.endedAt,
        endedReason: message.endedReason,
      };

      // Send email notifications if configured
      // We do this asynchronously and don't block the response
      const notificationEmails = (agent.advanced_config as any)?.notificationEmails;
      
      if (Array.isArray(notificationEmails) && notificationEmails.length > 0) {
        console.log(`Sending email notifications to ${notificationEmails.length} recipients`);
        
        const emailHtml = formatCallEmailHtml({
          agentName: agent.name,
          summary,
          transcript: transcriptText,
          recordingUrl,
          structuredData,
          callId: call.id,
          durationSeconds
        });

        // Fire and forget (mostly), but catch errors
        resend.emails.send({
          from: 'Travel Voice AI <notifications@travelvoice.co.uk>',
          to: notificationEmails,
          subject: `Call Report: ${agent.name} - ${new Date().toLocaleString()}`,
          html: emailHtml,
        }).then((response) => {
          if (response.error) {
            console.error('Failed to send email:', response.error);
          } else {
            console.log('Email sent successfully:', response.data?.id);
          }
        }).catch((err) => {
          console.error('Error sending email:', err);
        });
      }

      // Insert call record
      const { error: insertError } = await supabase
        .from('calls')
        .insert({
          agent_uuid: agent.uuid,
          organization_uuid: agent.organization_uuid,
          vapi_call_id: call.id,
          duration_seconds: durationSeconds,
          sentiment: mapSentiment(undefined),
          recording_url: recordingUrl,
          transcript: transcriptMessages,
          extracted_data: extractedData,
          status:
            message.endedReason === 'customer-ended-call' ||
            call.status === 'completed' ||
            call.status === 'ended'
              ? 'completed'
              : 'failed',
        });

      if (insertError) {
        console.error('Failed to insert call record:', insertError);
        return NextResponse.json({ error: 'Failed to insert call' }, { status: 500 });
      }

      // Deduct minutes from organization balance
      // Check if we have a valid duration to deduct
      if (durationSeconds > 0) {
        console.log(`Deducting ${durationSeconds} seconds from organization ${agent.organization_uuid}`);
        
        // Use RPC or direct update. Direct update is simpler but race-condition prone without atomic decrement.
        // For now, simple decrement. In production, consider a Postgres function `decrement_minutes`.
        // We will use a direct raw SQL query via rpc if possible, or just fetched data.
        // Actually, let's just update based on current known value? No, that's bad.
        // Supabase doesn't have an atomic 'decrement' in JS client easily without RPC.
        // Let's create a quick RPC or do a read-modify-write (less safe but works for low volume).
        
        // Better approach: Call a custom RPC function if it exists, or just read-update.
        // We'll assume low concurrency for now and do read-update for simplicity unless we added an RPC.
        
        const { data: orgData } = await supabase
            .from('organizations')
            .select('time_remaining_seconds')
            .eq('uuid', agent.organization_uuid)
            .single();
            
        if (orgData) {
            const newTime = Math.max(0, (orgData.time_remaining_seconds || 0) - durationSeconds);
            await supabase
                .from('organizations')
                .update({ time_remaining_seconds: newTime })
                .eq('uuid', agent.organization_uuid);
        }
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

