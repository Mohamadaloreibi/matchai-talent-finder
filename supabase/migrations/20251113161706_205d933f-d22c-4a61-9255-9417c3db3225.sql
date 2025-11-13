-- Update the INSERT policy to prevent authenticated users from storing email addresses
-- Only anonymous users (user_id IS NULL) should store email in the feedback table
DROP POLICY IF EXISTS "feedback_submission_with_validation" ON public.feedback;

CREATE POLICY "feedback_submission_secure"
ON public.feedback
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated users MUST set user_id to auth.uid() and email MUST be NULL
  (auth.uid() IS NOT NULL AND user_id = auth.uid() AND email IS NULL)
  OR
  -- Anonymous users MUST have user_id as NULL and MUST provide email
  (auth.uid() IS NULL AND user_id IS NULL AND email IS NOT NULL)
);