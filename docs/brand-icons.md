# Brand Icons Research

Status: research note, not yet implemented.

## Summary

Lucide should remain the icon library for interface icons in this app, but it should not be treated as a source for brand logos.

Lucide's official position is that brand icons were removed in Lucide v1 and will not be accepted back because of trademark/legal risk, brand usage restrictions, design consistency, and maintenance cost. Lucide recommends Simple Icons for brand marks.

Sources:

- https://lucide.dev/brand-logo-statement
- https://lucide.dev/guide/version-1

## Package Options

### `simple-icons`

- Canonical package for Simple Icons brand SVG data.
- Good when the app needs only a small number of brand marks and we are comfortable wrapping SVG data ourselves.
- Registry version observed on 2026-05-16: `16.19.0`.
- Source: https://www.npmjs.com/package/simple-icons

### `vue3-simple-icons`

- Simple Icons packaged as Vue components.
- Best Vue-specific drop-in if the app needs common brand icons such as GitHub.
- Registry version observed on 2026-05-16: `16.10.0`.
- Source: https://www.npmjs.com/package/vue3-simple-icons

### `@iconify/vue` with `@iconify-json/simple-icons`

- Good when the app needs broader icon-set access, not only brands.
- Uses Iconify's Vue component and Simple Icons data package.
- Registry versions observed on 2026-05-16:
  - `@iconify/vue`: `5.0.1`
  - `@iconify-json/simple-icons`: `1.2.82`
- Sources:
  - https://www.npmjs.com/package/@iconify/vue
  - https://www.npmjs.com/package/@iconify-json/simple-icons

### `unplugin-icons`

- Build-time Iconify integration that can expose Simple Icons as tree-shaken Vue components.
- Better fit than runtime Iconify if the app grows into many imported icons.
- Registry version observed on 2026-05-16: `23.0.1`.
- Source: https://www.npmjs.com/package/unplugin-icons

### `@lucide/lab`

- Official Lucide-adjacent package, but not a brand icon package.
- Contains experimental Lucide-style icons with niche or unclear use cases.
- Registry version observed on 2026-05-16: `0.1.2`.
- Source: https://www.npmjs.com/package/@lucide/lab

## Recommendation

Keep `@lucide/vue` for UI and navigation icons.

If brand icons are needed soon, add `vue3-simple-icons`. It keeps the current Vue component workflow simple and avoids pretending brand logos belong in Lucide.

If the app later needs many icon families beyond brands, use `unplugin-icons` with the Iconify Simple Icons collection instead.
