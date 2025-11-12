-- Add admin-only policies for user_roles table to prevent privilege escalation
-- Only admins can assign roles
CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can modify roles
CREATE POLICY "Only admins can modify roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can remove roles
CREATE POLICY "Only admins can remove roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));