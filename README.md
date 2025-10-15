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

## ¿Cómo puedo desplegar este proyecto?

El repositorio está listo para cualquier proveedor que soporte aplicaciones de Vite/React. Genera una build de producción con `npm run build` y despliega el contenido de la carpeta `dist` en tu plataforma preferida.

## ¿Puedo conectar un dominio personalizado?

Sí. Configura tu dominio en el proveedor de alojamiento que elijas y apunta el DNS al despliegue generado por tu servicio de hosting.
