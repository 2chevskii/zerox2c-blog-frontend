# Frontend Project Context

Last reviewed: 2026-05-17.

## Purpose

This repository is the public reader frontend for the `0x2c.dev` blog. It is not the admin UI and not a marketing landing page. The first screen should remain the actual reader experience: account controls, search, and published posts.

## Stack

- Vue 3 with `<script setup lang="ts">`.
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`.
- Vite, configured to run dev server on port `5174`.
- Vue Router for routes.
- Pinia setup stores for state.
- Tailwind CSS v4 through `@tailwindcss/vite`.
- Lucide Vue for interface icons.
- VueUse for document title, keyboard shortcuts, focus helpers, debounce, scroll state, and infinite scroll.

Use existing dependencies and patterns first. Add packages only when there is a clear product reason.

## Repository Layout

- `src/views/`: route-level screens.
- `src/components/`: reusable UI components.
- `src/components/PostSearchBar/`: split search/autocomplete component and its composables.
- `src/api/`: endpoint wrappers. Keep these thin.
- `src/stores/`: Pinia state and API orchestration.
- `src/types/api.ts`: backend DTOs and query types.
- `src/utils/`: small formatting and URL helpers.
- `src/styles.css`: Tailwind theme tokens and global article/body styles.
- `docs/brand-icons.md`: research note for future brand icon decisions.

## Current Product Surface

Implemented frontend flows:

- Home route `/` lists published posts with search, tag pills, date filters, loading/error/empty states, and infinite scroll.
- Post details route `/posts/:slug` loads by slug or id and renders backend-sanitized `bodyHtml`.
- Auth routes `/signin` and `/signup` support local username/email login and user registration.
- Guest-only auth routes redirect authenticated users back to the requested redirect path or `/`.
- App startup refreshes the current user when a stored session exists and clears invalid sessions.
- Header shows compact guest auth actions or a grouped authenticated account/logout control.

Not implemented in this frontend yet:

- Comment reading or creation.
- Like/dislike actions. Counts are displayed only.
- Steam login UI, despite backend support.
- Admin features. Use `../blog-admin-frontend` for admin work.
- Pages, sitemap, health UI, or SEO metadata beyond titles.

## Backend Contract

The backend lives at `../blog-backend`. Public frontend code currently uses:

- `GET /api/posts` with `offset`, `limit`, `search`, comma-separated `tags`, inclusive `from`, and inclusive `to`.
- `GET /api/posts/keywords` with `search` and `limit` for generated keyword suggestions.
- `GET /api/posts/{slugOrId}`.
- `GET /api/tags` with `offset`, `limit`, and `search`.
- `GET /api/images/{id}`.
- `POST /api/auth/login`.
- `POST /api/auth/register`.
- `GET /api/me`.

`src/api/http.ts` centralizes JSON requests, `ApiError`, bearer token attachment, and API base URL handling. `VITE_API_BASE_URL` can point to another origin; otherwise `/api` is proxied by Vite to `VITE_API_PROXY_TARGET` or `http://localhost:5000`.

Important backend-doc note: some backend docs still describe public tag listing as planned, but current backend source contains `TagsController` at `api/tags`, and this frontend depends on it.

Keep DTOs in `src/types/api.ts` aligned with backend contracts. Do not infer new API behavior from UI needs alone; inspect backend source first.

## State And Data Flow

`usePostsStore` owns reader data:

- `posts`, `selectedPost`, `availableTags`.
- Search text, selected tags, and `from`/`to` date filters.
- Pagination offset, `hasMore`, and loading/error flags.
- Request-id protection for list loads so stale responses do not overwrite newer searches.
- Page size is currently `9`.

`HomeView` owns scroll behavior:

- Uses VueUse `useInfiniteScroll(window, ...)`.
- Tracks `lastInfiniteLoadY` so scrolling up does not trigger repeated loads.
- Resets infinite scroll after new searches.
- Debounces text search by 250 ms.

`useAuthStore` owns reader session state:

- Session key is `zero-x2c-reader-session`.
- Session is stored in `localStorage`.
- Expired or malformed sessions are removed.
- `apiRequest` reads the stored access token for bearer auth.
- `isBlocked` is displayed in the header but no write actions currently exist in this frontend.

## Search Bar Behavior

`PostSearchBar` is deliberately split because it became complex during prior iterations.

Supported syntax and interaction:

- Plain text updates `search`.
- `#tag` creates an editable tag pill backed by available tags.
- `from:yyyy-mm-dd` and `to:yyyy-mm-dd` create date pills and emit date filters.
- `from:` and `to:` suggestions appear while typing semantic tokens.
- `Ctrl+K` focuses the search input.
- `Esc` blurs/closes search overlays.
- `Enter` submits the search and blurs.
- `Tab` accepts suggestions or confirms pill editing; raw tab navigation inside the active search control is intentionally suppressed.
- Backspace/arrow-left at the start of the main input edits or removes pills before the text input.

Search keyword suggestions come from `GET /api/posts/keywords`, and tag suggestions come from available tags fetched from the backend. Keep the same UI contract or update `useAutocomplete.ts` and `types.ts` together.

## UI And Styling Rules

The current visual direction is a dense dark technical reader UI:

- Background is near-black/concrete with mist text and brass/ember accents.
- Cards and controls generally use `#252525` and `#303030`.
- Use Lucide icons for interface actions.
- Keep controls compact, mobile-first, readable, and accessible.
- Prefer stable dimensions, good tap targets, and no layout shift.
- Avoid marketing hero sections, decorative cards, gradient blobs, and copy that explains obvious UI behavior.
- Article readability has priority over decoration.
- Article body HTML is backend-rendered and inserted with `v-html`; frontend should style it, not parse Markdown locally.

Global article styles live in `src/styles.css` under `.article-body` and `.article-shell`. Maintain these as the single place for rendered post content styling unless a new content surface requires a clear exception.

## Coding Conventions

- Use existing single quotes in TypeScript files unless the touched file already uses double quotes.
- Use path alias `@/` for `src` imports.
- Keep endpoint wrappers small and typed.
- Keep route screens in `src/views/` and reusable pieces in `src/components/`.
- Keep component-local behavior in composables only when it reduces real complexity, as with `PostSearchBar`.
- Prefer computed values for template-derived state.
- Preserve existing behavior when making visual or refactor changes.
- Add comments sparingly; prefer readable code.

## Verification

Before finishing implementation changes that touch application code, build configuration, dependencies, generated assets, or other runtime-affecting files, run:

```powershell
npm run build
```

Documentation-only changes do not require a build.

If a dev server is started for manual verification, stop it before finishing unless the user explicitly asks to keep it running.
