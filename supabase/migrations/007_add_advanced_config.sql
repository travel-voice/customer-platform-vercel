-- Add advanced_config column to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS advanced_config JSONB DEFAULT '{}'::jsonb;

