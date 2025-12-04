-- Add Stripe specific columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add index for stripe customer id lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON public.organizations(stripe_customer_id);

-- Ensure time_remaining_seconds is never null
UPDATE public.organizations SET time_remaining_seconds = 1800 WHERE time_remaining_seconds IS NULL; -- Default to 30 mins (1800s) if null
ALTER TABLE public.organizations ALTER COLUMN time_remaining_seconds SET DEFAULT 1800;

