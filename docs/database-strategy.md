# Diseño de base de datos para candidatos sanitarios

## 1. Reglas de negocio recopiladas
- Cada candidato almacena **nombre completo**, **fecha de nacimiento**, datos de contacto y cartas de presentación tanto en inglés como en noruego.
- El perfil incluye la **información profesional base** (profesión, resumen de experiencia, idiomas y formación) duplicada para ambos idiomas.
- Se destaca una única experiencia principal con su ámbito asistencial (domicilio geriátrico, hospitalario u urgencias) y traducciones opcionales del título y la duración.
- Todo el perfil debe disponer de versiones en inglés y en noruego listas para mostrarse sin depender de traducciones opcionales.
- La información se alimentará mediante servicios automatizados (n8n) y debe poder desplegarse tanto en Supabase como en PostgreSQL administrado (Azure).

Estas reglas se reflejan en el tipo `Candidate` utilizado por el front-end y en los datos de ejemplo disponibles en el repositorio.【F:src/types/candidate.ts†L1-L38】【F:src/data/mockCandidates.ts†L1-L375】

## 2. Esquema relacional adoptado
La aplicación utiliza una única tabla `public.candidates` que combina los campos obligatorios con columnas JSONB para almacenar metadatos bilingües. El archivo `20251026120000_prepare_complete_candidate_profile.sql` contiene la migración que deja la estructura lista para Supabase o PostgreSQL estándar.【F:supabase/migrations/20251026120000_prepare_complete_candidate_profile.sql†L1-L90】

Además, se incluyen tablas auxiliares para persistir la actividad de los empleadores (búsquedas, vistas de perfiles y solicitudes de reuniones), los usuarios administrados desde el panel y los registros de acceso. Todos estos objetos se crean en la migración `20251030120000_create_activity_logging_tables.sql` junto con sus políticas RLS, índices y triggers de mantenimiento.【F:supabase/migrations/20251030120000_create_activity_logging_tables.sql†L1-L122】

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
  profile_en JSONB NOT NULL,
  profile_no JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Restricciones destacadas:
- `primary_care_setting` utiliza el enum `care_setting` para garantizar los valores permitidos.
- `experience_detail` almacena un objeto JSON con la experiencia principal (título, duración, `care_setting`, traducciones de título y duración). Un `CHECK` obliga a que `experience_detail->>'care_setting'` coincida con `primary_care_setting`.
- `profile_en` y `profile_no` guardan los perfiles completos bilingües siguiendo la estructura `CandidateLocalizedProfile` del front-end.
- Los índices `candidates_primary_care_setting_idx` y `candidates_created_at_idx` aceleran los filtros por ámbito asistencial y las consultas ordenadas por fecha.
- La función `update_updated_at_column` y el trigger asociados mantienen el campo `updated_at` sincronizado tras cada modificación.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L68-L80】

Tablas auxiliares destacadas:
- `public.app_users`: almacena los usuarios gestionados por el administrador, con RLS que permite al rol `authenticated` realizar operaciones completas y un trigger `updated_at` reutilizable.【F:supabase/migrations/20251030120000_create_activity_logging_tables.sql†L7-L38】
- `public.access_logs`: guarda los registros de inicio de sesión con el enum `user_role` y políticas de lectura/escritura para automatizaciones autenticadas.【F:supabase/migrations/20251030120000_create_activity_logging_tables.sql†L40-L62】
- `public.candidate_view_logs` y `public.schedule_requests`: referencian a `public.candidates` para capturar interacciones de empleadores y mantienen índices por candidato para facilitar auditorías rápidas.【F:supabase/migrations/20251030120000_create_activity_logging_tables.sql†L64-L105】
- `public.employer_search_logs`: conserva las búsquedas realizadas por cada empleador, actualiza automáticamente `updated_at` y permite lecturas/actualizaciones controladas por RLS.【F:supabase/migrations/20251030120000_create_activity_logging_tables.sql†L107-L122】

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
El front-end espera que cada fila de `public.candidates` pueda mapearse al tipo `Candidate`, incluyendo `experienceDetail`, `profile_en` y `profile_no`. Los datos de demostración cubren múltiples ámbitos asistenciales para probar los filtros y búsquedas de la interfaz.【F:src/data/mockCandidates.ts†L1-L375】【F:src/lib/search.ts†L1-L240】 La carta de presentación usa saltos de línea que la UI respeta (`white-space: pre-line`).【F:src/components/CandidateCard.tsx†L1-L200】

Con esta estructura, la migración queda alineada con el modelo de datos del front-end y preparada para ejecutarse en Supabase o en cualquier instancia de PostgreSQL compatible.

## 7. Ajustes posteriores a la migración

Una vez ejecutadas las migraciones incluidas en el repositorio puedes seguir modificando el esquema o los datos. La recomendación es generar nuevas migraciones para que los cambios queden versionados y se apliquen en todos los entornos:

1. Crea una nueva migración con `supabase migration new <nombre>` o `supabase db diff --use-migrations`. El CLI añadirá un archivo SQL dentro de `supabase/migrations`.
2. Edita el archivo generado con los `ALTER TABLE`, `CREATE INDEX`, `INSERT`, etc. necesarios.
3. Ejecuta `supabase db push` (o `supabase db reset` en entornos locales) para aplicar la migración en la base de datos de destino.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L1-L80】【F:supabase/migrations/20251026120000_prepare_complete_candidate_profile.sql†L1-L90】

Si necesitas hacer ediciones puntuales en la base de datos ya migrada (por ejemplo, corregir un registro o cargar datos iniciales) puedes usar el editor SQL de Supabase o conectar con `psql` y ejecutar las sentencias necesarias. Las políticas de seguridad permiten escrituras al rol `authenticated`, el previsto para automatizaciones como n8n.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L38-L67】 Documenta estas modificaciones creando migraciones adicionales cuando deban replicarse en otros entornos.
