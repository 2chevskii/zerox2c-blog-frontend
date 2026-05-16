# Agent Instructions

Follow this file when making changes in this frontend repository.

## Project Snapshot

This is the public reader frontend for the `0x2c.dev` blog backend. It is a Vue 3 + TypeScript + Vite single-page app using Vue Router, Pinia, Tailwind CSS v4, Lucide Vue icons, and VueUse.

The backend lives at `../blog-backend`. Read the backend `README.md` and architecture docs before changing API behavior assumptions.

## Architecture Rules

- Keep route-level views under `src/views/`.
- Keep reusable UI pieces under `src/components/`.
- Keep backend DTOs in `src/types/api.ts`.
- Keep endpoint wrappers in `src/api/`.
- Keep Pinia state under `src/stores/`.
- Prefer the existing Vue, Tailwind, and utility patterns before adding new abstractions or dependencies.

## UX Rules

- This is a public technical blog, not a marketing landing page.
- Optimize mobile-first, then enhance larger breakpoints.
- Keep reading surfaces fast, accessible, and stable.
- Do not let decorative styling compromise article readability, tap targets, or text wrapping.

## Verification

Before finishing implementation changes, run:

```powershell
npm run build
```

If you start a local dev server during verification, stop it before finishing unless the user explicitly asks to keep it running. Never leave Vite, preview, backend, watcher, or other long-running development processes running after the task is done.
