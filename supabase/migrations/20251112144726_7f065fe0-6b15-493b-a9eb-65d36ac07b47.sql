-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;

-- Create a new policy that allows bootstrap
CREATE POLICY "Admins can assign roles or bootstrap first admin"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    -- Allow if user is already an admin
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Allow if no admins exist yet (bootstrap case)
    NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role
    )
  );