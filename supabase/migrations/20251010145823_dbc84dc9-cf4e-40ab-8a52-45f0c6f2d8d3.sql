DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
DROP FUNCTION IF EXISTS public.update_updated_at_column;
DROP TABLE IF EXISTS public.candidate_experiences;
DROP TABLE IF EXISTS public.candidates;
DROP TYPE IF EXISTS public.care_setting;

-- Ensure cryptographic helpers like gen_random_uuid are available before creating tables
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Core candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_year SMALLINT NOT NULL CHECK (birth_year BETWEEN 1900 AND date_part('year', now())),
  cover_letter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enum describing the care setting where the experience took place
CREATE TYPE public.care_setting AS ENUM (
  'domicilio_geriatrico',
  'hospitalario',
  'urgencias'
);

-- Each medical experience is stored independently to allow multiple entries per candidate
CREATE TABLE public.candidate_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  care_setting public.care_setting NOT NULL,
  position SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX candidate_experiences_candidate_idx ON public.candidate_experiences(candidate_id, position);

-- Enable Row Level Security so we can control who writes to the tables in Supabase
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experiences ENABLE ROW LEVEL SECURITY;

-- Read-only access for anonymous visitors (listing candidates)
CREATE POLICY "Public can read candidates"
ON public.candidates
FOR SELECT
USING (true);

CREATE POLICY "Public can read candidate experiences"
ON public.candidate_experiences
FOR SELECT
USING (true);

-- Only authenticated service roles should write data (e.g. n8n automations)
CREATE POLICY "Authenticated can manage candidates"
ON public.candidates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can manage candidate experiences"
ON public.candidate_experiences
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Maintain updated_at automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();