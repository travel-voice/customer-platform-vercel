-- Add vapi_structured_output_id to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS vapi_structured_output_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agents_vapi_structured_output_id ON public.agents(vapi_structured_output_id);

