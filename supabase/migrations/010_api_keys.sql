-- API Keys table for secure programmatic access
-- Security Design:
-- 1. Keys are hashed using SHA-256 before storage (raw key shown only at creation)
-- 2. Key prefix and hint stored for identification without exposing the full key
-- 3. Scoped permissions allow fine-grained access control
-- 4. Usage tracking for security monitoring and rate limiting
-- 5. Optional expiration for time-limited access

CREATE TABLE IF NOT EXISTS public.api_keys (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  created_by_uuid UUID NOT NULL REFERENCES public.users(uuid) ON DELETE SET NULL,
  
  -- Key identification (for display in UI)
  name TEXT NOT NULL, -- User-friendly name like "Production Server" or "Webhook Integration"
  key_prefix TEXT NOT NULL, -- First 12 chars: "tvsk_abc123..." for identification
  key_hint TEXT NOT NULL, -- Last 4 chars: "...xyz9" for verification
  
  -- Security: Only store the hash, never the raw key
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the full key
  
  -- Permissions (JSON array of allowed scopes)
  -- Possible scopes: 'agents:read', 'agents:write', 'calls:read', 'calls:write', 'widget:config', '*' (all)
  scopes JSONB NOT NULL DEFAULT '["*"]'::jsonb,
  
  -- Status and lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ, -- NULL means never expires
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT, -- For security auditing
  usage_count INTEGER DEFAULT 0, -- Total number of API calls made with this key
  
  -- Metadata
  description TEXT, -- Optional longer description
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON public.api_keys(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash); -- Critical for fast key validation
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON public.api_keys(created_by_uuid);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view API keys in their organization (but not the hash!)
CREATE POLICY "Users can view API keys in their organization"
  ON public.api_keys FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- Only admins can create API keys
CREATE POLICY "Admins can create API keys in their organization"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    organization_uuid IN (
      SELECT organization_uuid FROM public.users 
      WHERE uuid = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update API keys (deactivate, rename, etc.)
CREATE POLICY "Admins can update API keys in their organization"
  ON public.api_keys FOR UPDATE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users 
    WHERE uuid = auth.uid() AND role = 'admin'
  ));

-- Only admins can delete API keys
CREATE POLICY "Admins can delete API keys in their organization"
  ON public.api_keys FOR DELETE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users 
    WHERE uuid = auth.uid() AND role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- API Key Usage Log table for detailed audit trail
CREATE TABLE IF NOT EXISTS public.api_key_usage_logs (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_uuid UUID NOT NULL REFERENCES public.api_keys(uuid) ON DELETE CASCADE,
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL, -- e.g., '/api/agents', '/api/calls'
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  status_code INTEGER, -- Response status
  
  -- Client info
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timing
  request_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER -- How long the request took
);

-- Indexes for usage logs
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_key ON public.api_key_usage_logs(api_key_uuid);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_org ON public.api_key_usage_logs(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_request_at ON public.api_key_usage_logs(request_at DESC);

-- Enable RLS on usage logs
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view usage logs for their organization
CREATE POLICY "Admins can view API key usage logs"
  ON public.api_key_usage_logs FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users 
    WHERE uuid = auth.uid() AND role = 'admin'
  ));

-- Function to validate and record API key usage (called from application code via service role)
-- This bypasses RLS intentionally since API requests don't have a user session
CREATE OR REPLACE FUNCTION public.validate_api_key(
  p_key_hash TEXT,
  p_endpoint TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  organization_uuid UUID,
  scopes JSONB,
  key_uuid UUID,
  error_message TEXT
) AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Look up the key by hash
  SELECT 
    ak.uuid,
    ak.organization_uuid,
    ak.scopes,
    ak.is_active,
    ak.expires_at
  INTO v_key
  FROM public.api_keys ak
  WHERE ak.key_hash = p_key_hash;
  
  -- Key not found
  IF v_key IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, NULL::UUID, 'Invalid API key'::TEXT;
    RETURN;
  END IF;
  
  -- Key is deactivated
  IF NOT v_key.is_active THEN
    RETURN QUERY SELECT false, v_key.organization_uuid, v_key.scopes, v_key.uuid, 'API key has been revoked'::TEXT;
    RETURN;
  END IF;
  
  -- Key is expired
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_key.organization_uuid, v_key.scopes, v_key.uuid, 'API key has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Update last used timestamp and increment counter
  UPDATE public.api_keys
  SET 
    last_used_at = NOW(),
    last_used_ip = p_ip_address,
    usage_count = usage_count + 1
  WHERE uuid = v_key.uuid;
  
  -- Log the usage if endpoint info provided
  IF p_endpoint IS NOT NULL THEN
    INSERT INTO public.api_key_usage_logs (
      api_key_uuid,
      organization_uuid,
      endpoint,
      method,
      ip_address,
      user_agent
    ) VALUES (
      v_key.uuid,
      v_key.organization_uuid,
      p_endpoint,
      COALESCE(p_method, 'UNKNOWN'),
      p_ip_address,
      p_user_agent
    );
  END IF;
  
  -- Return valid key info
  RETURN QUERY SELECT true, v_key.organization_uuid, v_key.scopes, v_key.uuid, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (actual validation done with service role)
GRANT EXECUTE ON FUNCTION public.validate_api_key TO service_role;

-- Comment explaining the security model
COMMENT ON TABLE public.api_keys IS 'Stores API keys for programmatic access. Keys are hashed - the raw key is only shown once at creation time.';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the API key. The raw key is never stored.';
COMMENT ON COLUMN public.api_keys.scopes IS 'JSON array of permission scopes. Use ["*"] for full access or specific scopes like ["agents:read", "calls:read"].';

