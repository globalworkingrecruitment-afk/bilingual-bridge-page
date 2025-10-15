-- Prepare comprehensive candidate profile support with bilingual metadata

-- Recreate the care_setting enum to enforce allowed values for primary experience context
DO $$
BEGIN
  CREATE TYPE public.care_setting AS ENUM (
    'domicilio_geriatrico',
    'hospitalario',
    'urgencias'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Ensure the candidates table contains the fields required by the application
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS primary_care_setting public.care_setting,
  ADD COLUMN IF NOT EXISTS experience_detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill newly added fields with coherent defaults so existing rows remain valid
UPDATE public.candidates
SET primary_care_setting = COALESCE(primary_care_setting, 'hospitalario'::public.care_setting);

UPDATE public.candidates
SET experience_detail = jsonb_build_object(
    'title', COALESCE(experience_detail->>'title', experience),
    'duration', COALESCE(experience_detail->>'duration', ''),
    'care_setting', COALESCE(experience_detail->>'care_setting', primary_care_setting::text),
    'titles', COALESCE(experience_detail->'titles', '{}'::jsonb),
    'durations', COALESCE(experience_detail->'durations', '{}'::jsonb)
  )
WHERE experience_detail IS NULL
   OR jsonb_typeof(experience_detail) <> 'object'
   OR NOT (experience_detail ? 'care_setting');

UPDATE public.candidates
SET translations = '{}'::jsonb
WHERE translations IS NULL;

-- Enforce integrity rules once defaults are in place
ALTER TABLE public.candidates
  ALTER COLUMN primary_care_setting SET NOT NULL,
  ALTER COLUMN experience_detail DROP DEFAULT,
  ALTER COLUMN translations DROP DEFAULT;

DO $$
BEGIN
  ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_primary_care_setting_matches_detail
      CHECK (
        experience_detail ? 'care_setting'
        AND (experience_detail->>'care_setting')::public.care_setting = primary_care_setting
      );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_experience_detail_is_object
      CHECK (
        jsonb_typeof(experience_detail) = 'object'
        AND experience_detail ? 'title'
        AND experience_detail ? 'duration'
      );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_experience_detail_titles_are_objects
      CHECK (
        NOT (experience_detail ? 'titles')
        OR jsonb_typeof(experience_detail->'titles') = 'object'
      );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_experience_detail_durations_are_objects
      CHECK (
        NOT (experience_detail ? 'durations')
        OR jsonb_typeof(experience_detail->'durations') = 'object'
      );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.candidates
    ADD CONSTRAINT candidates_translations_is_object
      CHECK (jsonb_typeof(translations) = 'object');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Useful indexes for filtering by care setting and ordering by recency
CREATE INDEX IF NOT EXISTS candidates_primary_care_setting_idx
  ON public.candidates(primary_care_setting);

CREATE INDEX IF NOT EXISTS candidates_created_at_idx
  ON public.candidates(created_at DESC);
