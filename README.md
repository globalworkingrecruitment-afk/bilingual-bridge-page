# Global Working – Bilingual Bridge Page

## Project info

A multilingual landing page showcasing Global Working's remote career services.

## How can I edit this code?

You can work with the project using any Git-aware workflow.

## ¿Cómo actualizo los cambios en Git?

Si estás trabajando de forma local y quieres subir tus ajustes al repositorio, abre una terminal (puede ser la integrada en tu IDE o una ventana de comandos de tu sistema) y navega a la carpeta del proyecto clonado. Desde ahí, ejecuta estos pasos básicos:

```sh
# 1. Revisa qué archivos han cambiado.
git status

# 2. Añade los archivos que quieras subir (usa rutas específicas en lugar de "." si prefieres ser más selectivo).
git add .

# 3. Crea un commit con un mensaje descriptivo.
git commit -m "tu mensaje explicando el cambio"

# 4. Envía el commit al repositorio remoto (sustituye "work" por tu rama si es distinta).
git push origin work
```

> ¿No sabes si estás en la carpeta correcta? Ejecuta `pwd` (macOS/Linux) o `cd` sin argumentos (Windows) y comprueba que la ruta termine en el nombre de tu proyecto. Si no es así, muévete con `cd` hasta llegar al directorio del repositorio antes de lanzar los comandos de Git.

> Consejo: si estás colaborando con más personas, ejecuta `git pull origin work` antes de comenzar para asegurarte de tener la versión más reciente y resuelve cualquier conflicto que pueda surgir.

### ¿Cómo veo qué cambios se han hecho?

Si quieres revisar o explicar qué se ha modificado antes de crear el commit o el pull request, estos comandos te ayudan:

```sh
# Lista los archivos que han cambiado y su estado (modificados, nuevos, eliminados).
git status

# Muestra línea a línea lo que cambió en los archivos (usa las flechas para desplazarte y "q" para salir).
git diff

# Visualiza el historial reciente de commits por si quieres inspirarte en cómo describir los cambios.
git log --oneline
```

Con esa información puedes redactar un mensaje de commit que resuma tus modificaciones, por ejemplo: `git commit -m "Corrige redirección del magic link y actualiza la guía de Git"`.

## Opciones para editar el proyecto

### Usa tu IDE preferido

Clona este repositorio y trabaja de forma local.

1. Asegúrate de tener Node.js y npm instalados (puedes usar [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).
2. Instala las dependencias con `npm install`.
3. Lanza el entorno de desarrollo con `npm run dev` y abre el enlace que se muestra en la terminal.

### Edita un archivo directamente en GitHub

1. Navega hasta el archivo que quieres modificar.
2. Haz clic en el botón "Edit" (icono de lápiz) en la esquina superior derecha.
3. Realiza tus cambios y crea un commit describiendo la modificación.

### Usa GitHub Codespaces

1. Navega a la página principal del repositorio.
2. Haz clic en el botón verde "Code".
3. Selecciona la pestaña "Codespaces".
4. Pulsa "New codespace" para abrir un entorno listo para editar.
5. Realiza tus cambios y sube tus commits cuando termines.

## ¿Qué tecnologías utiliza este proyecto?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## ¿Cómo conecto la base de datos de Supabase?

Para un recorrido detallado puedes consultar [docs/configuracion-supabase.md](./docs/configuracion-supabase.md). El resumen es el siguiente:

1. Ejecuta las migraciones del repositorio en tu proyecto de Supabase para crear la tabla `public.candidate_data`, los triggers y las políticas RLS descritas en `docs/migracion-completa.sql`.
2. En la sección **Authentication > Users** de Supabase crea un usuario de servicio (por ejemplo `globalworkingrecruitment@gmail.com`) con una contraseña segura. Este usuario será el que utilice la aplicación para autenticarse como rol `authenticated`.
3. En Supabase asigna permisos de lectura/escritura al usuario de servicio (basta con mantener el rol por defecto `authenticated`, las políticas RLS ya permiten todas las operaciones autenticadas).
4. Crea un archivo `.env.local` en la raíz del proyecto con estas variables:

```env
VITE_SUPABASE_URL="https://<tu-proyecto>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
VITE_SUPABASE_SERVICE_EMAIL="globalworkingrecruitment@gmail.com"
VITE_SUPABASE_SERVICE_PASSWORD="contraseña-segura"
```

5. Arranca la aplicación con `npm run dev`. Al iniciar sesión en la app web se establecerá automáticamente la sesión de Supabase usando el usuario de servicio y se cargarán los registros de `candidate_data`.
6. Si necesitas acceder al panel `/admin`, añade también `VITE_ADMIN_USERNAME` y `VITE_ADMIN_PASSWORD` en `.env.local`. No hace falta crear un rol especial en Supabase: estas credenciales solo viven en la app y se utilizan para el inicio de sesión del panel.

## ¿Cuál es la raíz del proyecto?

La carpeta raíz es el directorio que contiene `package.json`, `vite.config.ts` y el resto de archivos principales del repositorio. Si clonaste el código con `git clone`, la ruta será similar a `.../bilingual-bridge-page/`. Desde ahí podrás ejecutar los comandos (`npm install`, `npm run dev`, etc.) y crear el archivo `.env.local`.

## ¿Cómo puedo desplegar este proyecto?

El repositorio está listo para cualquier proveedor que soporte aplicaciones de Vite/React. Genera una build de producción con `npm run build` y despliega el contenido de la carpeta `dist` en tu plataforma preferida.

## ¿Puedo conectar un dominio personalizado?

Sí. Configura tu dominio en el proveedor de alojamiento que elijas y apunta el DNS al despliegue generado por tu servicio de hosting.
