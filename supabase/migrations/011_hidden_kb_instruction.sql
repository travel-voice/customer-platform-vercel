-- Migration: Hide Knowledge Base Instruction from Users
-- The kb_instruction should not be visible in the UI, only sent to Vapi

-- Add a separate column for KB instruction (hidden from users)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS kb_instruction TEXT;

-- Clean up existing [Knowledge Base Access] blocks from system_prompt
-- and move them to the new kb_instruction column
DO $$
DECLARE
    agent_record RECORD;
    kb_block TEXT;
    clean_prompt TEXT;
BEGIN
    FOR agent_record IN 
        SELECT uuid, system_prompt 
        FROM agents 
        WHERE system_prompt LIKE '%[Knowledge Base Access]%'
    LOOP
        -- Extract the KB block
        kb_block := substring(agent_record.system_prompt FROM E'\\[Knowledge Base Access\\]\n[^\n]*');
        
        -- Remove the KB block from system_prompt (including the preceding newlines)
        clean_prompt := regexp_replace(
            agent_record.system_prompt, 
            E'\n\n\\[Knowledge Base Access\\]\n[^\n]*', 
            '', 
            'g'
        );
        
        -- Update the record
        UPDATE agents 
        SET 
            system_prompt = TRIM(clean_prompt),
            kb_instruction = kb_block
        WHERE uuid = agent_record.uuid;
    END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN agents.kb_instruction IS 'Auto-generated knowledge base instruction for Vapi. Hidden from users in UI.';

