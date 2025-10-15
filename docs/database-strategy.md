# Diseño de base de datos para candidatos sanitarios

## 1. Reglas de negocio recopiladas
- Cada candidato almacena **nombre completo**, **fecha de nacimiento**, datos de contacto y una **carta de presentación** en español.
- El perfil incluye la **información profesional base** (profesión, resumen de experiencia, idiomas y formación).
- Se destaca una única experiencia principal con su ámbito asistencial (domicilio geriátrico, hospitalario u urgencias) y traducciones opcionales del título y la duración.
- Todo el perfil puede ofrecer traducciones opcionales para mostrar contenido bilingüe.
- La información se alimentará mediante servicios automatizados (n8n) y debe poder desplegarse tanto en Supabase como en PostgreSQL administrado (Azure).

Estas reglas se reflejan en el tipo `Candidate` utilizado por el front-end y en los datos de ejemplo disponibles en el repositorio.【F:src/types/candidate.ts†L1-L38】【F:src/data/mockCandidates.ts†L1-L375】

## 2. Esquema relacional adoptado
La aplicación utiliza una única tabla `public.candidates` que combina los campos obligatorios con columnas JSONB para almacenar metadatos bilingües. El archivo `20251026120000_prepare_complete_candidate_profile.sql` contiene la migración que deja la estructura lista para Supabase o PostgreSQL estándar.【F:supabase/migrations/20251026120000_prepare_complete_candidate_profile.sql†L1-L90】

### 2.1 Definición SQL principal
```sql
CREATE TYPE public.care_setting AS ENUM (
  'domicilio_geriatrico',
  'hospitalario',
  'urgencias'
);

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  experience TEXT NOT NULL,
  languages TEXT NOT NULL,
  cover_letter_summary TEXT NOT NULL,
  cover_letter_full TEXT NOT NULL,
  education TEXT NOT NULL,
  birth_date DATE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  primary_care_setting public.care_setting NOT NULL,
  experience_detail JSONB NOT NULL,
  translations JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Restricciones destacadas:
- `primary_care_setting` utiliza el enum `care_setting` para garantizar los valores permitidos.
- `experience_detail` almacena un objeto JSON con la experiencia principal (título, duración, `care_setting`, traducciones de título y duración). Un `CHECK` obliga a que `experience_detail->>'care_setting'` coincida con `primary_care_setting`.
- `translations` guarda las versiones localizadas del perfil siguiendo la estructura `CandidateLocalizedProfile` del front-end.
- Los índices `candidates_primary_care_setting_idx` y `candidates_created_at_idx` aceleran los filtros por ámbito asistencial y las consultas ordenadas por fecha.
- La función `update_updated_at_column` y el trigger asociados mantienen el campo `updated_at` sincronizado tras cada modificación.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L68-L80】

## 3. Políticas de seguridad
La tabla mantiene Row Level Security habilitado. Las políticas incluidas permiten la lectura pública y restringen cualquier escritura al rol `authenticated`, el adecuado para los flujos automatizados (n8n).【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L38-L67】

## 4. Aplicación en Supabase
1. Configura el CLI (`supabase login`).
2. Ejecuta `supabase db reset` o `supabase db push` para aplicar todas las migraciones del directorio `supabase/migrations`.
3. Define las credenciales del servicio (rol `authenticated`) que usarán los procesos de n8n para respetar las políticas RLS vigentes.

## 5. Aplicación en PostgreSQL/Azure Database for PostgreSQL
1. Conéctate con un superusuario (`psql`, Azure Cloud Shell, etc.).
2. Ejecuta `CREATE EXTENSION IF NOT EXISTS pgcrypto;` para habilitar `gen_random_uuid()`.
3. Reproduce en orden los archivos SQL de `supabase/migrations` o ejecuta el script consolidado indicado en la sección 2.1.
4. Crea un usuario de servicio con permisos `INSERT/UPDATE/DELETE` sobre `public.candidates` y replica, si lo necesitas, la política de seguridad mediante `GRANT` y `ROW LEVEL SECURITY`.

## 6. Datos de ejemplo y tipado en la aplicación
El front-end espera que cada fila de `public.candidates` pueda mapearse al tipo `Candidate`, incluyendo `experienceDetail` y `translations`. Los datos de demostración cubren múltiples ámbitos asistenciales para probar los filtros y búsquedas de la interfaz.【F:src/data/mockCandidates.ts†L1-L375】【F:src/lib/search.ts†L1-L240】 La carta de presentación usa saltos de línea que la UI respeta (`white-space: pre-line`).【F:src/components/CandidateCard.tsx†L1-L200】

Con esta estructura, la migración queda alineada con el modelo de datos del front-end y preparada para ejecutarse en Supabase o en cualquier instancia de PostgreSQL compatible.
