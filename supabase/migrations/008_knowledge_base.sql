-- Create agent_files table
CREATE TABLE IF NOT EXISTS public.agent_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(uuid) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  vapi_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_files_agent_id ON public.agent_files(agent_id);

-- Enable RLS
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view files for their agents"
  ON public.agent_files FOR SELECT
  USING (agent_id IN (
    SELECT uuid FROM public.agents WHERE organization_uuid IN (
      SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
    )
  ));

CREATE POLICY "Users can insert files for their agents"
  ON public.agent_files FOR INSERT
  WITH CHECK (agent_id IN (
    SELECT uuid FROM public.agents WHERE organization_uuid IN (
      SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
    )
  ));

CREATE POLICY "Users can delete files for their agents"
  ON public.agent_files FOR DELETE
  USING (agent_id IN (
    SELECT uuid FROM public.agents WHERE organization_uuid IN (
      SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
    )
  ));

-- Create function to update updated_at
CREATE TRIGGER update_agent_files_updated_at BEFORE UPDATE ON public.agent_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage Bucket and Policies Setup
-- Note: Storage bucket creation and RLS policy setup for storage.objects 
-- requires elevated permissions and should be done via the Supabase Dashboard.
-- 
-- To complete the setup:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named 'agent_knowledge_base' with:
--    - Public: false (private bucket)
--    - File size limit: 10MB
-- 3. Add the following storage policies for the bucket via Dashboard > Storage > Policies:
--
-- Policy: "Users can upload knowledge base files"
-- Type: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
--   bucket_id = 'agent_knowledge_base' AND
--   (storage.foldername(name))[1] IN (
--     SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
--       SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
--     )
--   )
--
-- Policy: "Users can view knowledge base files"
-- Type: SELECT
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'agent_knowledge_base' AND
--   (storage.foldername(name))[1] IN (
--     SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
--       SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
--     )
--   )
--
-- Policy: "Users can delete knowledge base files"
-- Type: DELETE
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'agent_knowledge_base' AND
--   (storage.foldername(name))[1] IN (
--     SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
--       SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
--     )
--   )
