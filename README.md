# Your Risk Manager (YRM) — Vercel Fixed Build

This project uses a relative path in `index.html` for `./src/main.jsx` to avoid
upload/import issues where Vercel fails to resolve `/src/main.jsx`.

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
- New Project → Import from GitHub (recommended) OR use Vercel CLI.
- Framework: Vite
- Build Command: vite build
- Output Directory: dist
