-- Drop the existing policy that doesn't explicitly handle null user_id
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;

-- Create a more explicit policy that ensures anonymous feedback is not accessible
-- Only authenticated users can view feedback where user_id matches their auth.uid()
-- This explicitly excludes anonymous feedback (user_id = null) from being viewed by anyone except admins
CREATE POLICY "Authenticated users can view only their own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Ensure the INSERT policy sets user_id for authenticated users
-- Update the insert policy to be more secure
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;

CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
TO public
WITH CHECK (
  -- For authenticated users, enforce that user_id matches auth.uid()
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- For anonymous users, allow submission but user_id must be null
  (auth.uid() IS NULL AND user_id IS NULL)
);