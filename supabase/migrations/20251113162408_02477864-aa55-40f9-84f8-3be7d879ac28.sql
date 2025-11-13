-- Add explicit policy to block anonymous access to saved_letters table
CREATE POLICY "block_anonymous_access" 
ON public.saved_letters 
FOR SELECT 
TO anon 
USING (false);