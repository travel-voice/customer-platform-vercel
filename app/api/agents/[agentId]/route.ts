import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient, StructuredOutputSchema } from '@/lib/vapi/client';
import { TRAVEL_DATAPOINTS } from '@/lib/constants/travel-datapoints';

// --- HIDDEN PROMPT INJECTION ---
// This prompt segment is appended to the user's system prompt but not shown in the UI.
// It lives here in the backend code (or could be in a DB config table later).
const HIDDEN_SYSTEM_PROMPT_SUFFIX = `
[Operational Protocol]
- You are representing our business professionally.
- Always remain polite, patient, and helpful.
- If the user asks about sensitive internal data, politely decline.
- Maintain the persona defined above but adhere to these operational guardrails.
`;

/**
 * Build a Vapi structured output JSON schema from data extraction config
 */
function buildStructuredOutputSchema(
  dataExtractionConfig: Record<string, { description: string; type: string }>
): StructuredOutputSchema {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  // Transform each configured datapoint into a schema property
  for (const [datapointId, config] of Object.entries(dataExtractionConfig)) {
    // Find the full datapoint definition to get the label
    const datapoint = TRAVEL_DATAPOINTS.find(dp => dp.id === datapointId);
    const label = datapoint?.label || datapointId;

    // Map our type to JSON schema type
    let schemaType: string;
    switch (config.type) {
      case 'integer':
        schemaType = 'integer';
        break;
      case 'number':
        schemaType = 'number';
        break;
      case 'boolean':
        schemaType = 'boolean';
        break;
      default:
        schemaType = 'string';
    }

    properties[datapointId] = {
      type: schemaType,
      description: config.description,
    };

    // For now, we'll make all fields optional to avoid extraction failures
    // You can mark specific fields as required based on business logic
  }

  return {
    type: 'object',
    properties,
    required, // Empty for now - all fields optional
    description: 'Extracted data from the call conversation',
  };
}

/**
 * GET /api/agents/[agentId]
 * Get agent details
 */
export async function GET(
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

    // Get the agent
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('uuid', agentId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // NOTE: We return the 'raw' system_prompt from DB to the frontend,
    // which does NOT include the HIDDEN_SYSTEM_PROMPT_SUFFIX.
    // This keeps it hidden from the user as requested.

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[agentId]
 * Update an agent and sync with Vapi
 */
export async function PATCH(
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

    // Get the agent to verify ownership and get Vapi ID
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('uuid', agentId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, image, voice_id, first_message, system_prompt, data_extraction_config,
      // Advanced settings
      firstMessageMode, waitTimeBeforeSpeaking, interruptionThreshold, maxDuration,
      transcriptionLanguage, confidenceThreshold, modelTemperature, maxTokens,
      voicemailDetectionEnabled, voicemailMessage, beepMaxAwaitSeconds, backgroundSound,
      notificationEmails
    } = body;

    // Build update object for database
    const dbUpdate: any = {};
    if (name !== undefined) dbUpdate.name = name;
    if (image !== undefined) dbUpdate.image = image;
    if (voice_id !== undefined) dbUpdate.voice_id = voice_id;
    if (first_message !== undefined) dbUpdate.first_message = first_message;
    
    // Store raw user prompt in DB (without hidden suffix)
    if (system_prompt !== undefined) {
        // If we have existing KB instructions in the DB (from file uploads), we need to preserve them 
        // OR re-inject them. The frontend likely sends the *editable* part.
        // However, our previous logic (documents/route.ts) appends to the DB system_prompt.
        // This creates a conflict: if frontend sends a clean prompt, we lose KB instructions.
        // IDEAL: Store user_prompt and system_prompt separately. 
        // CURRENT COMPROMISE: We assume frontend sends the "user visible" part.
        // If we have KB instructions in the existing prompt, let's try to preserve them?
        // Actually, the `documents` route appends to the prompt string. 
        // If the user edits the prompt here, they might overwrite KB instructions if the frontend didn't load them.
        
        // Let's just save what the user sent for now. The KB logic might need to re-run or be smarter.
        // For this specific task (Hidden Prompt), we just save the user prompt to DB as-is.
        dbUpdate.system_prompt = system_prompt;
    }

    if (data_extraction_config !== undefined) dbUpdate.data_extraction_config = data_extraction_config;

    // Handle advanced config
    const advancedConfig = existingAgent.advanced_config || {};
    let hasAdvancedUpdates = false;

    if (firstMessageMode !== undefined) { advancedConfig.firstMessageMode = firstMessageMode; hasAdvancedUpdates = true; }
    if (waitTimeBeforeSpeaking !== undefined) { advancedConfig.waitTimeBeforeSpeaking = waitTimeBeforeSpeaking; hasAdvancedUpdates = true; }
    if (interruptionThreshold !== undefined) { advancedConfig.interruptionThreshold = interruptionThreshold; hasAdvancedUpdates = true; }
    if (maxDuration !== undefined) { advancedConfig.maxDuration = maxDuration; hasAdvancedUpdates = true; }
    if (transcriptionLanguage !== undefined) { advancedConfig.transcriptionLanguage = transcriptionLanguage; hasAdvancedUpdates = true; }
    if (confidenceThreshold !== undefined) { advancedConfig.confidenceThreshold = confidenceThreshold; hasAdvancedUpdates = true; }
    if (modelTemperature !== undefined) { advancedConfig.modelTemperature = modelTemperature; hasAdvancedUpdates = true; }
    if (maxTokens !== undefined) { advancedConfig.maxTokens = maxTokens; hasAdvancedUpdates = true; }
    if (voicemailDetectionEnabled !== undefined) { advancedConfig.voicemailDetectionEnabled = voicemailDetectionEnabled; hasAdvancedUpdates = true; }
    if (voicemailMessage !== undefined) { advancedConfig.voicemailMessage = voicemailMessage; hasAdvancedUpdates = true; }
    if (beepMaxAwaitSeconds !== undefined) { advancedConfig.beepMaxAwaitSeconds = beepMaxAwaitSeconds; hasAdvancedUpdates = true; }
    if (backgroundSound !== undefined) { advancedConfig.backgroundSound = backgroundSound; hasAdvancedUpdates = true; }
    if (notificationEmails !== undefined) { advancedConfig.notificationEmails = notificationEmails; hasAdvancedUpdates = true; }

    if (hasAdvancedUpdates) {
      dbUpdate.advanced_config = advancedConfig;
    }

    // Handle structured data extraction configuration
    let structuredOutputId = existingAgent.vapi_structured_output_id;
    
    if (data_extraction_config !== undefined && existingAgent.vapi_assistant_id) {
      try {
        // Build the JSON schema from data_extraction_config
        const schema = buildStructuredOutputSchema(data_extraction_config);
        
        if (Object.keys(data_extraction_config).length > 0) {
          // There are data points to extract
          if (structuredOutputId) {
            // Update existing structured output
            await vapiClient.updateStructuredOutput(structuredOutputId, {
              name: `${existingAgent.name || name || 'Agent'} - Data Extraction`,
              schema,
            });
            console.log('Updated Vapi structured output:', structuredOutputId);
          } else {
            // Create new structured output
            const structuredOutput = await vapiClient.createStructuredOutput({
              name: `${existingAgent.name || name || 'Agent'} - Data Extraction`,
              schema,
            });
            structuredOutputId = structuredOutput.id;
            dbUpdate.vapi_structured_output_id = structuredOutputId;
            console.log('Created Vapi structured output:', structuredOutputId);
          }

          // Link the structured output to the assistant
          await vapiClient.updateAssistant(existingAgent.vapi_assistant_id, {
            artifactPlan: {
              structuredOutputIds: [structuredOutputId],
            },
          });
          console.log('Linked structured output to assistant');
        } else {
          // No data points selected - remove structured output link
          if (structuredOutputId) {
            await vapiClient.updateAssistant(existingAgent.vapi_assistant_id, {
              artifactPlan: {
                structuredOutputIds: [],
              },
            });
            dbUpdate.vapi_structured_output_id = null;
            console.log('Removed structured output link from assistant');
          }
        }
      } catch (structuredOutputError: any) {
        console.error('Structured output update error:', structuredOutputError);
        // Continue with database update even if structured output fails
      }
    }

    // 1. Update in Vapi if we have vapi_assistant_id and relevant fields changed
    if (existingAgent.vapi_assistant_id) {
      try {
        // Prepare Vapi update payload
        const vapiUpdate: any = {};
        
        if (name !== undefined) vapiUpdate.name = name;
        if (voice_id !== undefined) vapiUpdate.voiceId = voice_id;
        if (first_message !== undefined) vapiUpdate.firstMessage = first_message;
        
        // INJECT HIDDEN PROMPT
        if (system_prompt !== undefined) {
            // Combine user prompt + hidden suffix
            vapiUpdate.systemPrompt = `${system_prompt}\n${HIDDEN_SYSTEM_PROMPT_SUFFIX}`;
        }

        // Map advanced settings to Vapi
        if (hasAdvancedUpdates) {
           if (advancedConfig.firstMessageMode) vapiUpdate.firstMessageMode = advancedConfig.firstMessageMode;
           if (advancedConfig.maxDuration) vapiUpdate.maxDurationSeconds = advancedConfig.maxDuration;
           if (advancedConfig.backgroundSound) vapiUpdate.backgroundSound = advancedConfig.backgroundSound;
           if (advancedConfig.transcriptionLanguage) vapiUpdate.transcriptionLanguage = advancedConfig.transcriptionLanguage;
           if (advancedConfig.modelTemperature) vapiUpdate.modelTemperature = advancedConfig.modelTemperature;
           if (advancedConfig.maxTokens) vapiUpdate.maxTokens = advancedConfig.maxTokens;
           
           if (advancedConfig.voicemailDetectionEnabled !== undefined) {
             vapiUpdate.voicemailDetection = {
               enabled: advancedConfig.voicemailDetectionEnabled,
               msg: advancedConfig.voicemailMessage,
               timeout: advancedConfig.beepMaxAwaitSeconds
             };
           }
        }

        if (Object.keys(vapiUpdate).length > 0) {
            await vapiClient.updateAssistant(existingAgent.vapi_assistant_id, vapiUpdate);
        }
      } catch (vapiError: any) {
        console.error('Vapi update error:', vapiError);
        // Continue with database update even if Vapi fails
      }
    }

    // 2. Update in database
    const { data: agent, error: updateError } = await supabase
      .from('agents')
      .update(dbUpdate)
      .eq('uuid', agentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('Update agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[agentId]
 * Delete an agent and remove from Vapi
 */
export async function DELETE(
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

    // Get the agent to verify ownership and get Vapi ID
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('uuid', agentId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 1. Delete from Vapi if we have vapi_assistant_id
    if (existingAgent.vapi_assistant_id) {
      try {
        await vapiClient.deleteAssistant(existingAgent.vapi_assistant_id);
      } catch (vapiError: any) {
        console.error('Vapi delete error:', vapiError);
        // Continue with database deletion even if Vapi fails
      }
    }

    // 2. Delete from database (cascade will delete related calls)
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('uuid', agentId);

    if (deleteError) {
      console.error('Error deleting agent:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
