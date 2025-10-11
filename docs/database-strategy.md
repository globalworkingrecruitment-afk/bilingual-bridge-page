# Diseño de base de datos para candidatos sanitarios

## 1. Reglas de negocio recopiladas
- Cada candidato debe almacenar **nombre completo**, **año de nacimiento** y una **carta de presentación** redactada en 5-6 líneas.
- Un candidato puede tener **cero, una o varias experiencias médicas**. Cada experiencia guarda un título descriptivo, la duración y el **ámbito asistencial** donde se desarrolló (domicilio geriátrico, hospitalario u urgencias).
- Todos los campos del candidato son obligatorios salvo la lista de experiencias.
- La aplicación consumirá la información mediante servicios automatizados (n8n) y debe mantenerse portable hacia PostgreSQL gestionado en Azure.

Estas reglas ya están reflejadas en el tipo `Candidate` del front-end y en los datos de ejemplo que muestran cartas y experiencias en español.【F:src/types/candidate.ts†L1-L15】【F:src/data/mockCandidates.ts†L1-L160】

## 2. Esquema relacional propuesto
Se normalizó el modelo en dos tablas relacionadas por claves foráneas:

- `candidates`: entidad principal con la información personal y la carta de presentación.
- `candidate_experiences`: almacena cada experiencia médica asociada a un candidato; el borrado en cascada mantiene la integridad cuando se elimina un candidato.

### 2.1 Definición SQL
El repositorio incluye el script inicial para Supabase/PostgreSQL con todas las restricciones necesarias.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L1-L80】

```sql
CREATE TYPE public.care_setting AS ENUM (
  'domicilio_geriatrico',
  'hospitalario',
  'urgencias'
);

-- Core candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_year SMALLINT NOT NULL CHECK (birth_year BETWEEN 1900 AND date_part('year', now())),
  cover_letter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medical experiences associated to each candidate
CREATE TABLE public.candidate_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  care_setting public.care_setting NOT NULL,
  position SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

Notas destacadas:
- `care_setting` obliga a clasificar cada experiencia en uno de los tres ámbitos requeridos por negocio (domicilio geriátrico, hospitalario o urgencias).
- `position` permite ordenar las experiencias como llegan desde los flujos de n8n.
- `gen_random_uuid()` requiere la extensión `pgcrypto`, habilitada por defecto en Supabase y disponible en Azure Database for PostgreSQL.
- Las políticas RLS incluidas exponen lectura pública y restringen escrituras a roles autenticados (ideal para el servicio de n8n).

## 3. Cómo aplicarlo en Supabase y en PostgreSQL/Azure
### Supabase
1. Asegúrate de tener el CLI configurado (`supabase login`).
2. Ejecuta `supabase db reset` o `supabase db push` para aplicar la migración incluida en `supabase/migrations`.
3. Configura las credenciales que usará n8n con el rol `authenticated` para respetar las políticas RLS creadas.【F:supabase/migrations/20251010145823_dbc84dc9-cf4e-40ab-8a52-45f0c6f2d8d3.sql†L44-L63】

### PostgreSQL/Azure Database for PostgreSQL
1. Conéctate al servidor con un superusuario (`psql` o Azure Cloud Shell).
2. Ejecuta `CREATE EXTENSION IF NOT EXISTS pgcrypto;` para habilitar `gen_random_uuid()`.
3. Aplica el mismo script SQL mostrado arriba (o el archivo completo de la carpeta `supabase/migrations`).
4. Crea un usuario de servicio con permisos `INSERT/UPDATE/DELETE` sobre ambas tablas para tus flujos de n8n y, si deseas seguridad equivalente a Supabase, replica las políticas mediante `GRANT` y `ROW LEVEL SECURITY`.

## 4. Datos de ejemplo y tipado en la aplicación
El front-end consume la información tipada en `Candidate`, que incluye el nombre completo, el año de nacimiento, la carta y el arreglo de experiencias con su ámbito asistencial.【F:src/types/candidate.ts†L1-L15】 Los datos de demostración muestran seis candidatos, uno de ellos sin experiencias para cubrir el caso borde.【F:src/data/mockCandidates.ts†L1-L160】 La carta se almacena en un solo campo de texto con saltos de línea y la interfaz respeta el formato (`white-space: pre-line`).【F:src/components/CandidateCard.tsx†L8-L63】

## 5. Ingesta automatizada con n8n
1. Inserta o actualiza el candidato en `public.candidates` (usa `UPSERT` sobre `id` si generas los UUID en n8n).
2. Borra e inserta las experiencias relacionadas en `public.candidate_experiences`, especificando siempre el `care_setting` y respetando el campo `position` para mantener el orden mostrado en la UI.
3. La interfaz ya está preparada para mostrar candidatos sin experiencias y listará cada entrada con título y duración; el filtrado agrupa automáticamente por ámbito asistencial gracias a `care_setting`.【F:src/pages/Index.tsx†L1-L132】【F:src/components/ExperienceFilters.tsx†L1-L73】

Con esta estructura la aplicación puede migrar sin fricciones hacia Azure Database for PostgreSQL y los flujos de n8n solo deben escribir en dos tablas simples y normalizadas.
