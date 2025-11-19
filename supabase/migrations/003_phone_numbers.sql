-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  agent_uuid UUID REFERENCES public.agents(uuid) ON DELETE SET NULL,
  phone_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- 'twilio', 'vapi', etc.
  provider_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organization ON public.phone_numbers(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_agent ON public.phone_numbers(agent_uuid);

-- Enable RLS
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view phone numbers in their organization"
  ON public.phone_numbers FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can update phone numbers in their organization"
  ON public.phone_numbers FOR UPDATE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can delete phone numbers in their organization"
  ON public.phone_numbers FOR DELETE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

