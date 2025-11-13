-- Ensure analysis_logs table exists with proper structure and RLS
CREATE TABLE IF NOT EXISTS public.analysis_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own analysis logs" ON public.analysis_logs;
DROP POLICY IF EXISTS "Users can insert their own analysis logs" ON public.analysis_logs;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own analysis logs"
  ON public.analysis_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis logs"
  ON public.analysis_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance on quota checks
CREATE INDEX IF NOT EXISTS idx_analysis_logs_user_created 
  ON public.analysis_logs(user_id, created_at DESC);