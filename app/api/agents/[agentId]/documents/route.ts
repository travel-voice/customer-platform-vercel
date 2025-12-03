import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';
import OpenAI from "openai";
import { HIDDEN_SYSTEM_PROMPT_SUFFIX } from '@/lib/constants/prompts';

// Define max file size (e.g., 10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    await syncKnowledgeBase(supabase, agentId, agent.vapi_assistant_id);

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
        await syncKnowledgeBase(supabase, agentId, agent.vapi_assistant_id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to sync the agent's knowledge base tool in Vapi
async function syncKnowledgeBase(supabase: any, agentId: string, vapiAssistantId: string | null) {
    if (!vapiAssistantId) return;

    // 1. Get all current files for this agent
    const { data: files } = await supabase
        .from('agent_files')
        .select('file_name, file_type, vapi_file_id')
        .eq('agent_id', agentId);
    
    const fileIds = files?.map((f: any) => f.vapi_file_id).filter(Boolean) || [];
    const fileNames = files?.map((f: any) => f.file_name).join(', ') || '';

    // 2. Get current agent config from DB (Source of Truth for Prompt)
    const { data: agent } = await supabase
        .from('agents')
        .select('system_prompt')
        .eq('uuid', agentId)
        .single();
        
    // 2b. Get current assistant configuration from Vapi (for Tool IDs and other settings)
    let assistant;
    try {
        assistant = await vapiClient.getAssistant(vapiAssistantId);
    } catch (e) {
        console.error('Failed to fetch assistant from Vapi:', e);
        return;
    }

    const currentToolIds = assistant.model?.toolIds || [];
    const sanitizedAgentId = agentId.replace(/-/g, '_');
    const toolName = `kb_${sanitizedAgentId}`;

    // 3. Find existing tool
    const tools = await vapiClient.listTools();
    const existingTool = tools.find(t => 
        t.type === 'query' && 
        t.function?.name === toolName
    );

    // --- NO FILES ---
    if (fileIds.length === 0) {
        if (existingTool) {
            // Detach from assistant
            const newToolIds = currentToolIds.filter((id: string) => id !== existingTool.id);

            // Remove KB instruction from prompt (use DB prompt as base)
            const currentSystemPrompt = agent?.system_prompt || '';
            let cleanSystemPrompt = currentSystemPrompt;
            
            // Remove the specific KB block we add
            cleanSystemPrompt = currentSystemPrompt.replace(/\n\n\[Knowledge Base Access\]\n[\s\S]*?(?=(\n\n|$))/, '').trim();
                
            // Also update DB
            await supabase.from('agents').update({ system_prompt: cleanSystemPrompt }).eq('uuid', agentId);

            // Update Vapi (User Prompt + Hidden Suffix)
            await vapiClient.updateAssistant(vapiAssistantId, {
                modelProvider: assistant.model?.provider,
                model: assistant.model?.model || 'gpt-4o-mini',
                modelTemperature: assistant.model?.temperature ?? 0.7,
                maxTokens: assistant.model?.maxTokens ?? 250,
                toolIds: newToolIds,
                systemPrompt: `${cleanSystemPrompt}\n${HIDDEN_SYSTEM_PROMPT_SUFFIX}`
            });
            
            // Ideally delete the tool itself too, but strictly optional if we detached it.
        }
        return;
    }

    // --- HAVE FILES ---
    
    // Generate Description & Instruction via OpenAI
    let kbDescription = 'Contains information about products, services, policies, and other relevant documentation.';
    let kbInstruction = `You have access to a knowledge base tool named '${toolName}'. Use it to answer user questions based on the provided documents.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in configuring AI Knowledge Bases. 
                    Generate a concise description for a Knowledge Base tool and a system prompt instruction for an AI assistant.
                    
                    The Knowledge Base contains these files: ${fileNames}
                    
                    Output JSON format:
                    {
                        "description": "A concise description (under 300 chars) of what this knowledge base contains based on the filenames.",
                        "instruction": "A clear instruction telling the assistant when and how to use the '${toolName}' tool. Be specific about the topics inferred from filenames."
                    }`
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            if (parsed.description) kbDescription = parsed.description;
            if (parsed.instruction) kbInstruction = parsed.instruction;
        }
    } catch (err) {
        console.error('OpenAI generation failed, using defaults:', err);
    }

    let kbToolId: string;

    // Update or Create Tool
    if (existingTool) {
        await vapiClient.updateTool(existingTool.id, {
            knowledgeBases: [{
                provider: 'google',
                name: 'default-kb',
                model: 'gemini-2.0-flash',
                description: kbDescription,
                fileIds: fileIds
            }],
            function: {
                name: toolName,
                description: kbDescription
            }
        });
        kbToolId = existingTool.id;
    } else {
        const newTool = await vapiClient.createTool({
            type: 'query',
            function: {
                name: toolName,
                description: kbDescription
            },
            knowledgeBases: [{
                provider: 'google',
                name: 'default-kb',
                model: 'gemini-2.0-flash',
                description: kbDescription,
                fileIds: fileIds
            }]
        });
        kbToolId = newTool.id;
    }

    // Update Assistant System Prompt & Tool Attachment
    const currentSystemPrompt = agent?.system_prompt || '';
    
    // Construct new prompt with KB instruction
    // Remove old block if exists, then append new
    let newSystemPrompt = currentSystemPrompt.replace(/\n\n\[Knowledge Base Access\]\n[\s\S]*?(?=(\n\n|$))/, '').trim();
    newSystemPrompt += `\n\n[Knowledge Base Access]\n${kbInstruction}`;

    // Save to DB (Visible Prompt)
    await supabase.from('agents').update({ system_prompt: newSystemPrompt }).eq('uuid', agentId);

    // Attach tool if missing
    const newToolIds = currentToolIds.includes(kbToolId) ? currentToolIds : [...currentToolIds, kbToolId];

    // Send to Vapi (Visible Prompt + Hidden Suffix)
    console.log('Syncing KB for agent:', agentId);
    console.log('New Tool IDs:', newToolIds);
    console.log('Model Provider:', assistant.model?.provider);

    await vapiClient.updateAssistant(vapiAssistantId, {
        modelProvider: assistant.model?.provider,
        model: assistant.model?.model || 'gpt-4o-mini',
        modelTemperature: assistant.model?.temperature ?? 0.7,
        maxTokens: assistant.model?.maxTokens ?? 250,
        toolIds: newToolIds,
        systemPrompt: `${newSystemPrompt}\n${HIDDEN_SYSTEM_PROMPT_SUFFIX}`
    });
}
