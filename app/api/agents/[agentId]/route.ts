import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient, StructuredOutputSchema } from '@/lib/vapi/client';
import { TRAVEL_DATAPOINTS } from '@/lib/constants/travel-datapoints';

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
    const { name, image, voice_id, first_message, system_prompt, data_extraction_config } = body;

    // Build update object for database
    const dbUpdate: any = {};
    if (name !== undefined) dbUpdate.name = name;
    if (image !== undefined) dbUpdate.image = image;
    if (voice_id !== undefined) dbUpdate.voice_id = voice_id;
    if (first_message !== undefined) dbUpdate.first_message = first_message;
    if (system_prompt !== undefined) dbUpdate.system_prompt = system_prompt;
    if (data_extraction_config !== undefined) dbUpdate.data_extraction_config = data_extraction_config;

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
    if (existingAgent.vapi_assistant_id && (name || voice_id || first_message || system_prompt)) {
      try {
        await vapiClient.updateAssistant(existingAgent.vapi_assistant_id, {
          name,
          voiceId: voice_id,
          firstMessage: first_message,
          systemPrompt: system_prompt,
        });
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
