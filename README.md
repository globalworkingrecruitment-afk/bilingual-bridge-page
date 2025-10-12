# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a200a069-d067-446d-9d69-cedc4064e8a1

## How can I edit this code?

There are several ways of editing your application.

## ¿Cómo actualizo los cambios en Git?

Si estás trabajando de forma local y quieres subir tus ajustes al repositorio, abre una terminal (la integrada en tu IDE, la de Lovable con **Terminal → New Terminal** o una ventana de comandos de tu sistema) y navega a la carpeta del proyecto clonado. Desde ahí, ejecuta estos pasos básicos:

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

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a200a069-d067-446d-9d69-cedc4064e8a1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a200a069-d067-446d-9d69-cedc4064e8a1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
