-- Rebuild candidate_data table with bilingual fields and RLS for authenticated users

DROP TABLE IF EXISTS public.candidate_data CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.candidate_data (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  nombre TEXT NOT NULL,
  experiencia_medica_en TEXT,
  experiencia_medica_no TEXT,
  experiencia_no_medica_en TEXT,
  experiencia_no_medica_no TEXT,
  formacion_en TEXT,
  formacion_no TEXT,
  profesion_en TEXT,
  profesion_no TEXT,
  idiomas_en TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  idiomas_no TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  carta_resumen_en TEXT,
  carta_en TEXT,
  carta_resumen_no TEXT,
  carta_no TEXT,
  estado TEXT NOT NULL DEFAULT 'activo',
  anio_nacimiento SMALLINT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidate_data_correo_email_chk CHECK (position('@' in correo) > 1),
  CONSTRAINT candidate_data_birth_year_chk CHECK (
    anio_nacimiento BETWEEN 1900 AND EXTRACT(YEAR FROM now())::INT
  )
);

CREATE TRIGGER trg_candidate_data_updated_at
BEFORE UPDATE ON public.candidate_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_candidate_data_nombre
  ON public.candidate_data (nombre);
CREATE INDEX idx_candidate_data_estado
  ON public.candidate_data (estado);
CREATE INDEX idx_candidate_data_anio
  ON public.candidate_data (anio_nacimiento);

ALTER TABLE public.candidate_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_data_select_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_insert_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_update_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_delete_auth ON public.candidate_data;

CREATE POLICY candidate_data_select_auth
  ON public.candidate_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY candidate_data_insert_auth
  ON public.candidate_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY candidate_data_update_auth
  ON public.candidate_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY candidate_data_delete_auth
  ON public.candidate_data
  FOR DELETE
  TO authenticated
  USING (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_data TO authenticated;
REVOKE ALL ON public.candidate_data FROM PUBLIC, anon;
