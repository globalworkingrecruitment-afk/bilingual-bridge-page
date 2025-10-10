-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT,
  experience TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  presentation TEXT NOT NULL,
  specialties TEXT[] NOT NULL,
  availability TEXT,
  languages TEXT[],
  certifications TEXT[],
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (employers can view all candidates)
CREATE POLICY "Candidates are viewable by everyone" 
ON public.candidates 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update/delete candidates
CREATE POLICY "Authenticated users can insert candidates" 
ON public.candidates 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete candidates" 
ON public.candidates 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();