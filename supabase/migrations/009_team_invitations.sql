-- Create team_invitations table for managing user invitations to organizations
CREATE TABLE IF NOT EXISTS public.team_invitations (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  invited_by_uuid UUID NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate pending invitations for same email in same org
  CONSTRAINT unique_pending_invitation UNIQUE (organization_uuid, email, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_organization ON public.team_invitations(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invitations

-- Users can view invitations in their organization
CREATE POLICY "Users can view invitations in their organization"
  ON public.team_invitations FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- Admins can create invitations in their organization
CREATE POLICY "Admins can create invitations in their organization"
  ON public.team_invitations FOR INSERT
  WITH CHECK (
    organization_uuid IN (
      SELECT organization_uuid FROM public.users 
      WHERE uuid = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update invitations in their organization (for cancelling)
CREATE POLICY "Admins can update invitations in their organization"
  ON public.team_invitations FOR UPDATE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users 
    WHERE uuid = auth.uid() AND role = 'admin'
  ));

-- Admins can delete invitations in their organization
CREATE POLICY "Admins can delete invitations in their organization"
  ON public.team_invitations FOR DELETE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users 
    WHERE uuid = auth.uid() AND role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired invitations (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.team_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

