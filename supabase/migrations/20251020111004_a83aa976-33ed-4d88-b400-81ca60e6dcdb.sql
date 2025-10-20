-- 1. Crear tipo ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Política para que admins puedan gestionar roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- 5. Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Crear función segura para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Eliminar políticas inseguras existentes de candidates
DROP POLICY IF EXISTS "Candidates are viewable by everyone" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidates;

-- 8. Crear políticas seguras para candidates
-- Solo usuarios autenticados pueden ver candidatos
CREATE POLICY "Authenticated users can view candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden insertar candidatos
CREATE POLICY "Only admins can insert candidates"
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden actualizar candidatos
CREATE POLICY "Only admins can update candidates"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden eliminar candidatos
CREATE POLICY "Only admins can delete candidates"
  ON public.candidates
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 10. Función helper para crear primer admin
CREATE OR REPLACE FUNCTION public.create_admin_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.create_admin_user(uuid) IS 'Función para asignar rol de admin a un usuario. Solo debe usarse durante configuración inicial.';

-- 11. Garantizar permisos
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.candidates TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;