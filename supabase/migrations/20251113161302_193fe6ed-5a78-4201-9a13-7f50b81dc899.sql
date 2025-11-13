-- Drop ALL variations of feedback SELECT policies
DO $$ 
BEGIN
  -- Drop any existing SELECT policies on feedback
  DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
  DROP POLICY IF EXISTS "Authenticated users can view only their own feedback" ON public.feedback;
  DROP POLICY IF EXISTS "Users can view only their authenticated feedback" ON public.feedback;
  DROP POLICY IF EXISTS "Authenticated users view own feedback only" ON public.feedback;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Drop ALL variations of feedback INSERT policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
  DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;
  DROP POLICY IF EXISTS "Secure feedback submission" ON public.feedback;
  DROP POLICY IF EXISTS "Authenticated and anonymous feedback submission" ON public.feedback;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create explicit SELECT policy that prevents access to anonymous feedback by regular users
CREATE POLICY "authenticated_users_own_feedback_only"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Create explicit INSERT policy that enforces user_id matching
CREATE POLICY "feedback_submission_with_validation"
ON public.feedback
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated users MUST set user_id to their auth.uid()
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous users MUST leave user_id as NULL
  (auth.uid() IS NULL AND user_id IS NULL)
);