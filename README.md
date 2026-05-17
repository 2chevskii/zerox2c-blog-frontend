# 0x2c.dev Blog Frontend

Public reader frontend for the 0x2c.dev blog.

## Stack

- Vue 3
- Vue Router
- Pinia
- Tailwind CSS v4
- Lucide Vue icons
- VueUse

## Local Development

Install dependencies:

```powershell
npm install
```

Run the development server:

```powershell
npm run dev
```

The Vite dev server proxies `/api` to `VITE_API_PROXY_TARGET`, which defaults to `http://localhost:5000`.

For deployments where the API is on another origin, set `VITE_API_BASE_URL`.

## Notes

- Brand icon research is documented in `docs/brand-icons.md`.
- Deployment process is documented in `docs/deployment.md`.
