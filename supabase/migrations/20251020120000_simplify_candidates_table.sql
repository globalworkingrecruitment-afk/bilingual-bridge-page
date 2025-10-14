-- Simplify schema to use a single candidates table with consolidated text fields
DROP POLICY IF EXISTS "Public can read candidate experiences" ON public.candidate_experiences;
DROP POLICY IF EXISTS "Authenticated can manage candidate experiences" ON public.candidate_experiences;

DROP TABLE IF EXISTS public.candidate_experiences;
DROP TYPE IF EXISTS public.care_setting;

ALTER TABLE public.candidates
  DROP COLUMN IF EXISTS birth_year,
  DROP COLUMN IF EXISTS cover_letter,
  ADD COLUMN IF NOT EXISTS profession TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS languages TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_letter_summary TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_letter_full TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS education TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS birth_date DATE NOT NULL DEFAULT '1900-01-01',
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Optional: remove defaults to avoid enforcing them on future inserts while keeping NOT NULL constraint
ALTER TABLE public.candidates
  ALTER COLUMN profession DROP DEFAULT,
  ALTER COLUMN experience DROP DEFAULT,
  ALTER COLUMN languages DROP DEFAULT,
  ALTER COLUMN cover_letter_summary DROP DEFAULT,
  ALTER COLUMN cover_letter_full DROP DEFAULT,
  ALTER COLUMN education DROP DEFAULT,
  ALTER COLUMN birth_date DROP DEFAULT;
