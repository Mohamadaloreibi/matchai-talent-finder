-- Drop all existing feedback policies to recreate them with explicit security rules
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can view only their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;

-- Policy 1: Admins can view all feedback (keep existing)
-- This policy should already exist, so we don't recreate it

-- Policy 2: Authenticated users can ONLY view their own feedback
-- Explicitly excludes anonymous feedback (user_id = null)
CREATE POLICY "Users can view only their authenticated feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Policy 3: Secure feedback submission
-- Authenticated users must set user_id to their auth.uid()
-- Anonymous users must leave user_id as null
CREATE POLICY "Secure feedback submission"
ON public.feedback
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.uid() IS NULL AND user_id IS NULL)
);