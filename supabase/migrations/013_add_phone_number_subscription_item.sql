-- Add stripe_subscription_item_id to phone_numbers table
ALTER TABLE public.phone_numbers
ADD COLUMN IF NOT EXISTS stripe_subscription_item_id TEXT;

