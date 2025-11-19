-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_plan TEXT,
  time_remaining_seconds INTEGER DEFAULT 0
);

-- Create users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  uuid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_uuid UUID REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image TEXT,
  voice_id TEXT,
  first_message TEXT,
  system_prompt TEXT,
  data_extraction_config JSONB,
  vapi_assistant_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_uuid UUID NOT NULL REFERENCES public.agents(uuid) ON DELETE CASCADE,
  organization_uuid UUID NOT NULL REFERENCES public.organizations(uuid) ON DELETE CASCADE,
  vapi_call_id TEXT UNIQUE,
  duration_seconds INTEGER,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  recording_url TEXT,
  transcript JSONB,
  extracted_data JSONB,
  status TEXT CHECK (status IN ('completed', 'empty', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_agents_organization ON public.agents(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_agents_vapi_id ON public.agents(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent ON public.calls(agent_uuid);
CREATE INDEX IF NOT EXISTS idx_calls_organization ON public.calls(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_id ON public.calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can update their own organization"
  ON public.organizations FOR UPDATE
  USING (uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- RLS Policies for users
CREATE POLICY "Users can view users in their organization"
  ON public.users FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (uuid = auth.uid());

-- RLS Policies for agents
CREATE POLICY "Users can view agents in their organization"
  ON public.agents FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can create agents in their organization"
  ON public.agents FOR INSERT
  WITH CHECK (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can update agents in their organization"
  ON public.agents FOR UPDATE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

CREATE POLICY "Users can delete agents in their organization"
  ON public.agents FOR DELETE
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- RLS Policies for calls
CREATE POLICY "Users can view calls in their organization"
  ON public.calls FOR SELECT
  USING (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called after a new auth.users record is created
  -- The actual user data will be inserted by the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation (optional - can be removed if we handle this in the app)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
