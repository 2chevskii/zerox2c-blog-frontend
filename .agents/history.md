# Frontend Iteration History

This summary was derived from `git log` on 2026-05-17.

## Timeline

### 2026-05-16

- `a9de6c1 chore: initial commit`
  - Created the Vue 3 + Vite + TypeScript reader frontend.
  - Added base API wrappers, post store, routes, global styles, post list/detail views, and basic reusable components.
  - Included a local Markdown utility at first.
  - Added initial repository docs and brand icon research.

- `6cdea5d docs: document related repositories`
  - Updated root agent instructions to explain the three-repository workspace:
    `blog-backend`, `blog-frontend`, and `blog-admin-frontend`.

### 2026-05-17

- `24a38a4 Refine home page card layout and hover details`
  - Reworked home page cards and visual layout.
  - Added public tag fetching through `src/api/tags.ts`.
  - Removed frontend Markdown parsing because post details now use backend-rendered HTML.
  - Expanded post list DTOs with tag and engagement metadata.

- `7353ba2 feat: refresh public blog reader UI`
  - Major reader UI refresh.
  - Added `PostMosaic` and an initial `PostSearchBar`.
  - Moved home page toward a compact search-and-mosaic reader experience.
  - Strengthened article body styling and dark theme tokens.

- `c9e921c chore: add commit workflow skill`
  - Added `.agents/skills/commit/SKILL.md` for repository-local commit behavior.

- `52511f2 fix: align like pill icon color`
  - Small visual correction in `PostCard`.

- `34ddd06 fix: remove home archive summary`
  - Removed the archive summary from the home route to keep the reader surface direct.

- `2379579 feat: enhance post search autocomplete`
  - Added local keyword/tag suggestion logic in `src/api/search.ts`.
  - Expanded `PostSearchBar` autocomplete behavior.

- `e11948e fix: refine search focus styling`
  - Improved focus overlay and active search styling.

- `f254041 fix: remove search input focus outline`
  - Removed unwanted native input outline inside the custom search control.

- `374c7ab feat: add semantic search token pills`
  - Added pill-based parsing for tags and semantic date tokens.
  - Introduced `#tag`, `from:`, and `to:` search interactions.

- `620f21b feat: improve semantic search keyboard flow`
  - Improved keyboard editing and confirmation behavior for semantic pills.

- `76fc1ea feat: add search pill navigation hints`
  - Added more navigable and discoverable pill interactions.

- `826ef77 refactor: use vueuse key stroke shortcut`
  - Replaced custom global shortcut handling with VueUse `onKeyStroke`.

- `d342257 fix: refine search submit keyboard behavior`
  - Tightened Enter/Tab/Escape behavior in search submission and autocomplete.

- `ee4b00b refactor: split post search bar component`
  - Broke the large search component into:
    - `PostSearchBar.vue`
    - `usePostSearchBar.ts`
    - `useAutocomplete.ts`
    - `focusControls.ts`
    - `searchTokens.ts`
    - `semanticFilters.ts`
    - `semanticItems.ts`
    - `semanticOrder.ts`
    - `types.ts`
    - `index.ts`
  - This is the current organization to preserve when changing search.

- `15fdcb0 feat: send post search date filters`
  - Connected `from` and `to` date pills to the posts API query.
  - Added date filter types and store state.

- `ef1a267 feat: add reader authentication`
  - Added `src/api/auth.ts`, `src/stores/auth.ts`, and `src/views/AuthView.vue`.
  - Added JWT bearer support to `apiRequest`.
  - Added route guards and startup current-user refresh.
  - Updated header for guest and authenticated account controls.

- `1f5c4b0 chore: set frontend dev server port`
  - Set Vite dev server port to `5174`.

- `795ab76 fix: improve sticky header behavior`
  - Adjusted app/header/home layout so sticky header behavior is more stable.

- `b72d095 fix: refine sticky header styling`
  - Simplified and tightened sticky header visual styling.

- `f71e655 fix: improve post list infinite scroll`
  - Improved infinite-scroll loading guards and layout.
  - Added request-id protection in the posts store.
  - Adjusted global scroll behavior.

- `7f648aa fix: stabilize sticky post search`
  - Tuned sticky offsets between header and search.

- `67737a0 fix: align post search spacing`
  - Small spacing adjustment around search.

- `f8f1d94 fix: tighten post list header spacing`
  - Reduced vertical spacing between header and post search/list.

- `8d71388 fix: update auth routes and form styling`
  - Renamed guest auth paths to `/signin` and `/signup`.
  - Tightened auth form styling.

- `ac00d8f fix: group authenticated header controls`
  - Grouped authenticated display name and logout button into one compact header control.

## Current Direction From History

- Preserve the compact public reader workflow. Recent commits repeatedly removed excess summary/hero-like content and tightened spacing.
- Treat `PostSearchBar` as a specialized component with deliberate keyboard behavior; avoid folding it back into one huge file.
- Keep sticky header and sticky search offsets stable. Many recent fixes were about preventing awkward spacing and scroll behavior.
- Keep API behavior aligned with backend source. The frontend has already moved from local Markdown parsing to backend-rendered sanitized HTML.
- Auth is reader-auth only. Do not add admin concepts to this frontend unless the product scope changes.
- Engagement counts are display data. No frontend mutation flow exists for likes, dislikes, comments, or views.
