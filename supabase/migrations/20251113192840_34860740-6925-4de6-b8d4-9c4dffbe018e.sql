-- Create analysis_logs table to track user analysis usage
CREATE TABLE public.analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own analysis logs
CREATE POLICY "Users can view their own analysis logs"
ON public.analysis_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own analysis logs
CREATE POLICY "Users can insert their own analysis logs"
ON public.analysis_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries on user_id and created_at
CREATE INDEX idx_analysis_logs_user_created 
ON public.analysis_logs(user_id, created_at DESC);