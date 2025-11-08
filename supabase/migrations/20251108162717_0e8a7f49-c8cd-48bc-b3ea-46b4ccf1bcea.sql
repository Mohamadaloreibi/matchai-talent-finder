-- Create saved_letters table
CREATE TABLE public.saved_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  letter_text TEXT NOT NULL,
  cv_text TEXT,
  job_description TEXT,
  tone TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_letters ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved letters" 
ON public.saved_letters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved letters" 
ON public.saved_letters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved letters" 
ON public.saved_letters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved letters" 
ON public.saved_letters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_letters_user_id ON public.saved_letters(user_id);
CREATE INDEX idx_saved_letters_created_at ON public.saved_letters(created_at DESC);