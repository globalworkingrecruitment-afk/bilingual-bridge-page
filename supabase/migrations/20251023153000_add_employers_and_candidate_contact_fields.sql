-- Add candidate contact fields without creating additional tables
-- These fields store private contact information for internal use only
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''::text;

-- Remove defaults now that existing rows are populated
ALTER TABLE public.candidates
  ALTER COLUMN email DROP DEFAULT,
  ALTER COLUMN phone DROP DEFAULT;
