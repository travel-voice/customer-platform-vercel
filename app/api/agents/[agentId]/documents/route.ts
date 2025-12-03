import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';

// Define max file size (e.g., 10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * GET /api/agents/[agentId]/documents
 * List all documents for an agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('organization_uuid')
      .eq('uuid', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify organization match
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData || userData.organization_uuid !== agent.organization_uuid) {
      return NextResponse.json({ error: 'Unauthorized access to agent' }, { status: 403 });
    }

    // Fetch files
    const { data: files, error: filesError } = await supabase
      .from('agent_files')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (filesError) {
      return NextResponse.json({ error: filesError.message }, { status: 500 });
    }

    // Generate signed URLs for each file so users can view/download them
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        try {
          const { data } = await supabase.storage
            .from('agent_knowledge_base')
            .createSignedUrl(file.storage_path, 3600); // 1 hour expiry
          
          return {
            ...file,
            download_url: data?.signedUrl || null
          };
        } catch (error) {
          console.error('Failed to generate signed URL:', error);
          return {
            ...file,
            download_url: null
          };
        }
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[agentId]/documents
 * Upload a new document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('uuid, organization_uuid, vapi_assistant_id')
      .eq('uuid', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify organization match
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData || userData.organization_uuid !== agent.organization_uuid) {
      return NextResponse.json({ error: 'Unauthorized access to agent' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const fileName = `${agentId}/${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('agent_knowledge_base')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
        // If bucket doesn't exist, we might need to handle that. 
        // But let's assume it exists or fail.
        console.error('Supabase storage upload error:', storageError);
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // 2. Upload to Vapi
    let vapiFile;
    try {
        vapiFile = await vapiClient.uploadFile(file);
    } catch (vapiError) {
        console.error('Vapi upload error:', vapiError);
        // Rollback storage upload
        await supabase.storage.from('agent_knowledge_base').remove([fileName]);
        return NextResponse.json({ error: 'Failed to upload file to Vapi' }, { status: 500 });
    }

    // 3. Save metadata to DB
    const { data: dbFile, error: dbError } = await supabase
      .from('agent_files')
      .insert({
        agent_id: agentId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        vapi_file_id: vapiFile.id
      })
      .select()
      .single();

    if (dbError) {
        console.error('DB insert error:', dbError);
        // Rollback Vapi and Storage
        await vapiClient.deleteFile(vapiFile.id);
        await supabase.storage.from('agent_knowledge_base').remove([fileName]);
        return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }

    // 4. Update Vapi Tool Configuration
    await updateVapiToolConfiguration(supabase, agentId, agent.vapi_assistant_id);

    return NextResponse.json({ file: dbFile });

  } catch (error: any) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[agentId]/documents
 * Delete a document
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json({ error: 'File ID required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Auth & Ownership checks (similar to above)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('uuid, organization_uuid, vapi_assistant_id')
            .eq('uuid', agentId)
            .single();
        
        if (agentError || !agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

        const { data: userData } = await supabase.from('users').select('organization_uuid').eq('uuid', user.id).single();
        if (!userData || userData.organization_uuid !== agent.organization_uuid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Get file details
        const { data: fileData, error: fetchError } = await supabase
            .from('agent_files')
            .select('*')
            .eq('id', fileId)
            .eq('agent_id', agentId)
            .single();

        if (fetchError || !fileData) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        // 1. Delete from Vapi
        if (fileData.vapi_file_id) {
            try {
                await vapiClient.deleteFile(fileData.vapi_file_id);
            } catch (e) {
                console.error('Error deleting file from Vapi:', e);
                // Continue anyway to clean up DB
            }
        }

        // 2. Delete from Supabase Storage
        if (fileData.storage_path) {
            const { error: storageError } = await supabase.storage
                .from('agent_knowledge_base')
                .remove([fileData.storage_path]);
            
            if (storageError) console.error('Error deleting from storage:', storageError);
        }

        // 3. Delete from DB
        const { error: deleteError } = await supabase
            .from('agent_files')
            .delete()
            .eq('id', fileId);
        
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

        // 4. Update Vapi Tool Configuration
        await updateVapiToolConfiguration(supabase, agentId, agent.vapi_assistant_id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to sync the agent's knowledge base tool in Vapi
async function updateVapiToolConfiguration(supabase: any, agentId: string, vapiAssistantId: string | null) {
    if (!vapiAssistantId) return;

    // 1. Get all current files for this agent
    const { data: files } = await supabase
        .from('agent_files')
        .select('vapi_file_id')
        .eq('agent_id', agentId);
    
    const fileIds = files?.map((f: any) => f.vapi_file_id).filter(Boolean) || [];

    // 2. Get current assistant configuration
    let assistant;
    try {
        assistant = await vapiClient.getAssistant(vapiAssistantId);
    } catch (e) {
        console.error('Failed to fetch assistant from Vapi:', e);
        return;
    }

    // 3. Find existing knowledge base tool
    // We look for a tool of type 'query' that seems to be our KB tool.
    // Or we check the tools attached to the assistant.
    const currentToolIds = assistant.model?.toolIds || [];
    
    let kbToolId: string | null = null;
    let kbTool: any = null;

    // We need to scan the tools to find which one is ours.
    // This implies fetching all tools or we need to store the toolId in our DB.
    // Storing toolId in DB would be better, but we didn't add a column for it.
    // Let's try to find it by name convention "Knowledge Base - [Agent Name]" or similar?
    // Or better: List all tools and find one used by this assistant that is a query tool.
    
    // Strategy: 
    // If we have a toolId stored (we don't yet), use it.
    // Else, create a new tool if we have files.
    // If we have no files, remove the tool if it exists (hard to track without ID).
    
    // Alternative: Create a tool named `kb-tool-${agentId}`.
    // If we assume unique names per org? Vapi tools are per org.
    // Let's search for a tool with function name `knowledge_base_${agentId_short}`.
    
    // Note: Function names in Vapi tools must be valid identifiers.
    const sanitizedAgentId = agentId.replace(/-/g, '_');
    const toolFunctionName = `knowledge_base_search`; // Generic name? 
    // Actually, if multiple agents share tools, it's fine. But here we want specific KB.
    // Let's use `kb_${sanitizedAgentId}`.
    
    const toolName = `kb_${sanitizedAgentId}`;

    // List all tools to find if we already created one
    // Ideally we should cache this tool ID in the agent record.
    // For now, let's list tools (might be slow if many tools).
    const tools = await vapiClient.listTools();
    const existingTool = tools.find(t => 
        t.type === 'query' && 
        t.function?.name === toolName
    );

    if (fileIds.length === 0) {
        // If no files, and we found a tool, delete it and remove from assistant
        if (existingTool) {
            // Detach from assistant
            const newToolIds = currentToolIds.filter(id => id !== existingTool.id);
            
            // Must preserve entire model configuration when updating toolIds
            const modelUpdate: any = {
                model: assistant.model?.model || 'gpt-4o-mini',
                modelTemperature: assistant.model?.temperature ?? 0.7,
                maxTokens: assistant.model?.maxTokens ?? 250,
                toolIds: newToolIds
            };

            // Preserve system prompt if it exists
            if (assistant.model?.messages && assistant.model.messages.length > 0) {
                modelUpdate.systemPrompt = assistant.model.messages.find((m: any) => m.role === 'system')?.content;
            }

            await vapiClient.updateAssistant(vapiAssistantId, modelUpdate);
        }
        return;
    }

    // We have files.
    if (existingTool) {
        // Update existing tool
        await vapiClient.updateTool(existingTool.id, {
            knowledgeBases: [
                {
                    provider: 'google',
                    name: 'default-kb',
                    description: 'Contains information about products, services, policies, and other relevant documentation.',
                    fileIds: fileIds
                }
            ]
        });
        kbToolId = existingTool.id;
    } else {
        // Create new tool
        const newTool = await vapiClient.createTool({
            type: 'query',
            function: {
                name: toolName,
                description: 'Search the knowledge base for answers to user questions.'
            },
            knowledgeBases: [
                {
                    provider: 'google',
                    name: 'default-kb',
                    description: 'Contains information about products, services, policies, and other relevant documentation.',
                    fileIds: fileIds
                }
            ]
        });
        kbToolId = newTool.id;
    }

    // 4. Attach tool to assistant if not already attached
    if (kbToolId && !currentToolIds.includes(kbToolId)) {
        const newToolIds = [...currentToolIds, kbToolId];
        
        // Must preserve entire model configuration when updating toolIds
        const modelUpdate: any = {
            model: assistant.model?.model || 'gpt-4o-mini',
            modelTemperature: assistant.model?.temperature ?? 0.7,
            maxTokens: assistant.model?.maxTokens ?? 250,
            toolIds: newToolIds
        };

        // Preserve system prompt if it exists
        if (assistant.model?.messages && assistant.model.messages.length > 0) {
            modelUpdate.systemPrompt = assistant.model.messages.find((m: any) => m.role === 'system')?.content;
        }

        await vapiClient.updateAssistant(vapiAssistantId, modelUpdate);
    }
}

