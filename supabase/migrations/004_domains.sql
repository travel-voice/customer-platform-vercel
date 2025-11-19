-- Create domains table
CREATE TABLE IF NOT EXISTS public.domains (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending', -- pending, verified, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_uuid, domain)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_domains_organization ON public.domains(organization_uuid);

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view domains in their organization"
  ON public.domains FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can create domains in their organization"
  ON public.domains FOR INSERT
  WITH CHECK (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can delete domains in their organization"
  ON public.domains FOR DELETE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

