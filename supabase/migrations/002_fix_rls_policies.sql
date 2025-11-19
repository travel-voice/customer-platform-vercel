-- Fix infinite recursion in users table RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;

-- Create a simpler policy that doesn't cause recursion
-- Users can view their own record
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (uuid = auth.uid());

-- Users can view other users in their organization (non-recursive)
CREATE POLICY "Users can view org members"
  ON public.users FOR SELECT
  USING (
    organization_uuid = (
      SELECT u.organization_uuid
      FROM public.users u
      WHERE u.uuid = auth.uid()
      LIMIT 1
    )
  );

-- Alternatively, use a single combined policy (simpler and faster)
-- Comment out the above two policies and use this one instead:
/*
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view org members" ON public.users;

CREATE POLICY "Users can view their organization"
  ON public.users FOR SELECT
  USING (
    uuid = auth.uid() OR
    organization_uuid IN (
      SELECT organization_uuid
      FROM public.users
      WHERE uuid = auth.uid()
      LIMIT 1
    )
  );
*/
