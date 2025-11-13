-- Add explicit DENY policy for anonymous users trying to SELECT feedback
-- This makes it crystal clear that unauthenticated users cannot read feedback
CREATE POLICY "anonymous_users_cannot_read_feedback"
ON public.feedback
FOR SELECT
TO anon
USING (false);