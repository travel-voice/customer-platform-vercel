-- Allow users to insert phone numbers for their organization
CREATE POLICY "Users can create phone numbers in their organization"
  ON public.phone_numbers FOR INSERT
  WITH CHECK (organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  ));

