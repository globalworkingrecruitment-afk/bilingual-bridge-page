# Configurar Supabase para Bilingual Bridge Page

Esta guía describe paso a paso cómo conectar la aplicación desplegada en Vercel con una base de datos alojada en Supabase.

## Requisitos previos

- Un proyecto activo en [Supabase](https://supabase.com/).
- Acceso al panel de Vercel donde está desplegada la aplicación.
- Haber instalado las dependencias del proyecto (`npm install`).

## 1. Ejecutar la migración completa

1. Entra en el panel de Supabase y selecciona tu proyecto.
2. Abre **SQL Editor** y pulsa **New query**.
3. Copia el contenido del archivo [`docs/migracion-completa.sql`](./migracion-completa.sql) del repositorio.
4. Pega el SQL en el editor y pulsa **Run** para crear las tablas, funciones y políticas (incluyendo `public.candidates` y los helpers `admin_create_app_user`, `admin_list_app_users`, `admin_toggle_app_user_status`, `admin_list_access_logs`, `admin_list_candidate_view_logs`, `admin_list_schedule_requests`, `admin_list_employer_search_logs` y `authenticate_app_user`).

> ❗ Si al crear usuarios ves el error `function gen_salt(unknown) does not exist`, significa que la extensión `pgcrypto` no se instaló. Ejecuta en el SQL Editor el comando `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;` y vuelve a intentar. Después comprueba que `select gen_random_uuid();` devuelve un valor para asegurarte de que quedó habilitada.

> 💡 Si prefieres usar la CLI de Supabase, ejecuta `supabase login`, `supabase link --project-ref <tu-ref>` y finalmente `supabase db push` desde la carpeta raíz del repositorio.

## 2. Crear el usuario de servicio

1. Ve a **Authentication → Users**.
2. Pulsa **Add user**.
3. Introduce el correo `globalworkingrecruitment@gmail.com` y una contraseña robusta (guárdala en un lugar seguro).
4. Marca **Auto confirm user** para que la cuenta quede verificada al instante.
5. Guarda los cambios. Este usuario será el que la aplicación use con el rol `authenticated`.

## 3. Verificar los permisos

Las políticas RLS incluidas en la migración ya permiten las operaciones de lectura y escritura para el rol `authenticated`. Además, la función `admin_create_app_user` creada por la migración permite insertar usuarios desde el panel incluso si posteriormente ajustas las políticas. Si actualizaste el repositorio recientemente, vuelve a ejecutar el script SQL para asegurarte de que la función existe en tu proyecto.

## 4. Obtener las credenciales del proyecto

1. En Supabase abre **Project Settings → API**.
2. Copia el valor de **Project URL** (por ejemplo `https://<tu-proyecto>.supabase.co`).
3. Copia la **anon public API key**.
4. Conserva el correo y la contraseña del usuario de servicio del paso anterior.

## 5. Configurar variables de entorno

1. En la raíz del proyecto crea un archivo `.env.local` con el siguiente contenido:

   ```env
   VITE_SUPABASE_URL="https://<tu-proyecto>.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
   VITE_SUPABASE_SERVICE_EMAIL="globalworkingrecruitment@gmail.com"
   VITE_SUPABASE_SERVICE_PASSWORD="<contraseña-segura>"
   ```

2. Si la aplicación está desplegada en Vercel, replica estas variables en **Project Settings → Environment Variables** (usa el entorno `Production` y `Preview` para compartir las mismas credenciales).

## 6. Configurar el acceso de administrador

El panel interno necesita un usuario con permisos de administrador, pero **no es necesario** crear un rol especial en Supabase ni añadir metadatos. El acceso se controla únicamente desde las variables de entorno de la aplicación.

1. Define en tu `.env.local` (y en Vercel, si corresponde) las credenciales que usarás para el login del panel:

   ```env
   VITE_ADMIN_USERNAME="<correo-o-alias-del-admin>"
   VITE_ADMIN_PASSWORD="<contraseña-del-admin>"
   ```

   Utiliza valores distintos a los de demostración (`admin` / `123`) para evitar accesos no autorizados.

2. Con esos valores podrás entrar en `/admin` usando el formulario de inicio de sesión. Internamente la app seguirá autenticándose contra Supabase con el usuario de servicio creado en el paso 2 para gestionar los datos.

3. (Opcional) Si quieres que el administrador aparezca en la tabla `app_users` —por ejemplo, para guardar un historial— puedes insertarlo manualmente con la misma contraseña que definiste en las variables de entorno:

   ```sql
   insert into public.app_users (username, password, full_name, email, is_active)
   values ('<correo-del-admin>', '<contraseña-del-admin>', 'Administrador', '<correo-del-admin>', true)
   on conflict (username) do update set password = excluded.password, full_name = excluded.full_name, email = excluded.email, is_active = true;
   ```

   Este paso es opcional y no afecta al acceso al panel, ya que la verificación del administrador es local.

## 7. Probar la integración en local

1. Ejecuta `npm run dev`.
2. Abre `http://localhost:5173` y haz clic en **Iniciar sesión**.
3. La aplicación iniciará sesión automáticamente con el usuario de servicio y cargará los registros de `candidates` si la base de datos está correctamente configurada.

## 8. Despliegue en Vercel

- Asegúrate de que el proyecto de Vercel tenga las mismas variables de entorno configuradas.
- En Supabase abre **Authentication → URL Configuration** y añade el dominio público de Vercel en `Site URL` (por ejemplo `https://<tu-app>.vercel.app`) y en `Additional Redirect URLs`. Esto evita bloqueos por CORS al autenticar al usuario de servicio desde producción.
- Vuelve a desplegar (`Redeploy`) o realiza un nuevo commit para que Vercel construya la aplicación con las credenciales actualizadas.

Con estos pasos la aplicación quedará conectada a Supabase tanto en local como en Vercel.
