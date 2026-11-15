# Taskflow — Task Manager

A lightweight task manager built with Next.js, React, and TypeScript. It is ready to run locally and deploy to Vercel.

## Features

- Create, edit, and delete tasks
- Set start dates, due dates, categories, and priorities
- Track task status and completion percentage
- Dashboard totals and overall progress
- Overdue task detection
- Search and filter tasks
- List and timeline views
- Responsive layout for desktop and mobile
- Browser localStorage persistence (no database or API keys required)

## Run locally

Requirements: Node.js 18.18+ (Node 20 LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy with GitHub + Vercel

1. Unzip this project.
2. Create a new GitHub repository.
3. In this folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial Taskflow app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

4. Sign in to Vercel and choose **Add New → Project**.
5. Import your GitHub repository.
6. Keep the detected framework as **Next.js** and the default build settings.
7. Click **Deploy**.

Future pushes to the connected GitHub branch will trigger a new Vercel deployment.

## Important data note

This starter stores tasks in the browser's localStorage. Data stays in that browser on that device and is not shared across browsers or devices. Clearing browser site data can remove saved tasks. For multi-device sync, team collaboration, or user accounts, connect a database such as Supabase and add authentication.

## Project structure

```text
task-manager-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```
