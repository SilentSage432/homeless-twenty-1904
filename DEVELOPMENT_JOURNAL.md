# Development Journal — Homeless Twenty 1904

## 2026-07-20 — Optional event images (crop flow reused)

- `events` gained optional `image_url text` — migration `20260720_events_image_url.sql` (+ added to init schema for fresh installs). Reuses the existing public `plaque-assets` bucket, so no new bucket/RLS.
- `database.types.ts` events Row/Insert/Update carry `image_url: string | null`; `fetchEvents` selects it; fallback seed events set `image_url: null`.
- `storage.ts` generalized: internal `uploadImageAsset(file, bucket, prefix)` powers `uploadPlaqueAsset` (`plaque-` prefix) + new `uploadEventAsset` (`event-` prefix); both target `plaque-assets`.
- **Composition (Rule 5):** `PlaqueImageEditor` generalized → `components/admin/ImageCropEditor.tsx` (props: `aspect`, `eyebrow`, `title`, `hint`). Both managers consume it. `ImageDropZone` gained an optional `label` prop.
- `ManageEventsForm`: optional image drop zone → crop editor (4:3, zoom/rotate) → cropped preview → upload on submit; "Adjust crop" + "Remove image" controls; roster rows show a thumbnail.
- Public `EventsBoard`: renders a full-width banner image (`h-48 sm:h-64`, `object-cover`, lazy) atop the card when `image_url` is present; text-only layout unchanged otherwise.
- Typecheck + lint + production build green.

---

## 2026-07-20 — Plaque Uploader: in-browser crop + rotate

- Added `react-easy-crop` (Cropper UI) + `react-image-file-resizer` (client-side compress/downscale).
- New `lib/utils/crop-image.ts`: `generateCroppedImage(src, cropAreaPixels, rotation)` → canvas rotate+crop to JPEG blob → Resizer downscale to 1600×1200 @ q82 → returns a `File`. Owns all pixel manipulation; presentation never re-derives it.
- New `components/admin/PlaqueImageEditor.tsx`: modal over the dashboard with `<Cropper>` (4:3 aspect), zoom slider, rotation slider + 90° buttons, Confirm/Cancel. Renders processing/error state.
- `ImageDropZone` (AdminUi) extended with optional `onPick` (intercept a freshly picked/dropped file instead of committing) + `previewUrl` (externally controlled cropped preview). Native `required` is dropped when `onPick` is set (the input never holds the final file); JS validation still guards submit.
- `ManagePlaquesForm` flow: Select/drop → editor opens (raw object URL) → Adjust/rotate/crop → Confirm → cropped `File` becomes `file`, cropped preview shows → **Publish/Update Plaque** uploads the processed File to `plaque-assets`. "Adjust crop & rotation" reopens the editor on the retained raw source. Per-URL cleanup effects revoke object URLs on replace/unmount.
- Typecheck + lint + production build green (`/admin/dashboard` first-load JS 226 kB).

---

## 2026-07-20 — Responsive pass II: 7xl wrappers + section titles

- Standardized all main wrappers (header both variants + mobile drawer, hero, about, plaques, events, footer, dashboard) to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Public section titles (About, Plaques, Events) scaled to `text-2xl sm:text-3xl md:text-4xl`.
- Added `overflow-x-hidden` to `<body>` (belt-and-suspenders with `<main>` + `overflow-x: clip`).
- Events kept as full-width stacked rows (each is a 3-panel horizontal card); `md:grid-cols-2` would crush the internal date/detail/registration layout. Plaque gallery already satisfies 2-col tablet (`sm:grid-cols-2 lg:grid-cols-3`).

---

## 2026-07-20 — Responsive & mobile polish pass

- `<main>` gets `overflow-x-hidden` (body already `overflow-x: clip`) to kill horizontal scroll.
- Fluid heading bases (`text-2xl sm:text-3xl md:text-4xl…`) on hero + dashboard title so 320px phones don't push content offscreen.
- Touch targets: `.admin-input` min-height 44px; new `.tap-target` (min-h 44px inline-flex) applied to roster Edit/Delete/Revoke/Refresh and telemetry re-run controls.
- Verified multi-column grids (events/plaques managers, Component D, telemetry) collapse to single column on mobile and rebalance on tablet; rosters stack/wrap without clipping; containers stay capped at `max-w-6xl`.

---

## 2026-07-20 — Auth callback + invite password activation

- `/auth/callback` (client route; localStorage session model): reads `?code=`, runs `exchangeCodeForSession`, falls back to hash/implicit session detection, then redirects to `/admin` — or `/admin/update-password` for `type=invite`/`recovery`.
- Missing/expired/provider errors redirect to `/admin?error=…`; `AdminLoginForm` renders that param.
- New `/admin/update-password` (invite activation) → `updateUserPassword` → success notification, then redirect to `/admin`.
- Note: chose a client callback because auth sessions live in localStorage, not SSR cookies; a server cookie route would be invisible to the existing gate.

---

## 2026-07-20 — Invite redirect uses production origin

- `inviteUserByEmail` origin: `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → `https://www.thehomelesstwenty1904.org`; `redirectTo = ${origin}/auth/callback`.
- Invite `user_metadata` now carries `{ full_name, role }`.

---

## 2026-07-20 — Steward revoke (Auth admin deleteUser)

- `DELETE /api/admin/stewards` with `{ id }` → `auth.admin.deleteUser` (service role). Blocks self-revoke; admins cannot revoke developers.
- Component D roster: **Revoke** per row (hidden for current user); confirms, then reloads list + `router.refresh()`.

---

## 2026-07-20 — Staff personnel + live content rosters

- Component D visible to both `admin` and `developer`; invite API uses `requireStaffRequest`. Admins may assign `admin`|`user` only; developers may assign any role.
- Events/Plaques: live rosters with Edit/Delete (confirm + TanStack invalidate + `router.refresh`). Plaque rows show image thumbnails.
- Payment URL + Delete gated by `canManageSensitiveContent` (admin/developer); standard `user` cannot view/alter payment URLs or delete.

---

## 2026-07-20 — Storage telemetry uses object list (not buckets metadata)

- Replaced `storage.getBucket` / `listBuckets` with `storage.from('plaque-assets').list('', { limit: 1 })`.
- Healthy (green) when `error` is null or is not a “bucket not found” response — avoids `storage.buckets` ownership constraints on managed Supabase.

---

## 2026-07-20 — Storage setup check is getBucket-only

- Telemetry no longer calls createBucket / listBuckets for plaque-assets.
- Diagnostics + “Run storage setup check” ping `storage.getBucket('plaque-assets')`; data → Healthy / Configured (green). Creation stays with the SQL migration.

---

## 2026-07-20 — Developer cockpit + steward invites

- `/admin/dashboard` control deck: sharper header chrome, pulsing status rings, monospace metrics grid.
- `plaque-assets` missing/unreachable → actionable banner + `POST /api/admin/storage/plaque-assets` (developer + service role).
- Component D `StewardManagementPanel`: invite by email/full name/role via `POST /api/admin/stewards` (`inviteUserByEmail` + profiles upsert); roster lists `public.profiles`.
- Server ownership: `lib/supabase/admin.ts` (service role never in browser); caller must be `developer`.
- Admin inputs: high-contrast labels, white fields, crimson focus rings.
- `.env.example` adds `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2026-07-20 — Profiles select aligned to remote schema

- Root cause of `/admin` pre-submit 400: `getCurrentProfile()` selected `created_at`, which is absent on rebuilt `public.profiles`.
- Select + `Database` types now use `id, updated_at, full_name, role` to match the live table.

---

## 2026-07-20 — Steward login password visibility toggle

- `AdminLoginForm`: `showPassword` state toggles password input between `type="password"` and `type="text"`.
- Eye / eye-off control sits on the right edge of the field (`aria-label` / `aria-pressed`) for verifying exact characters before submit.

---

## 2026-07-20 — RBAC roles (developer | admin | user)

- `profiles.role` enum replaces boolean `is_admin`.
- Dashboard isolation: `admin` → Event Manager + Plaque Uploader only; `developer` → + System Overrides (deployment, DB, storage metrics).
- RLS helpers `can_manage_content()` / `current_profile_role()`; both admin and developer may write events, plaques, and `plaque-assets`.
- Migration `20260720_rbac_profiles_role.sql` upgrades legacy boolean installs.

---

## 2026-07-20 — Museum-grade hero + polished admin CMS

### Presentation
- `HeroOvalFrame` structural component: B&W oval `/assets/hero-oval.png`, thin gold border, soft depth.
- Hero: matte charcoal, fine-grain texture overlay, faint crimson radial behind frame; typography “THE HOMELESS TWENTY” / “NO. 1904”.
- Global `duration-500 ease-out` museum transitions on buttons, cards, media, drop zones, oval frame.

### Admin CMS
- `/admin` → `/admin/dashboard` secure portal (parchment panels on slate band).
- Events Manager: Title, Description, Date/Time, Label, Ticket/Payment URL → live public Pre-Pay when set.
- Plaque Uploader: drag-and-drop zone → `uploadPlaqueAsset` → `plaque-assets` → `plaques.image_url`.
- RLS unchanged: public SELECT; admin-only INSERT/UPDATE/DELETE on tables + storage.

---

## 2026-07-20 — Hero oval + admin dashboard/storage forms

### UI
- Hero restructured: deep matte-black wrapper, soft crimson radial glow, centered oval `/assets/hero-oval.png` with thin gold border, typography stack “THE HOMELESS TWENTY” above / “NO. 1904” below.

### Admin
- `/admin` login redirects authorized stewards to `/admin/dashboard`.
- `ManageEventsForm`: Title, Description, Date, Label, Payment URL — live Pre-Pay link when URL present.
- `ManagePlaquesForm`: Title, Location, file input → `uploadPlaqueAsset` → `plaque-assets` bucket → `plaques.image_url`.
- Forms fully reset (including file input) after successful create/update.

### Storage
- Migration `20260720_plaque_assets_bucket.sql` creates public `plaque-assets` bucket with admin-only write RLS.

---

## 2026-07-20 — Next.js hybrid migration scaffold

Migrated from static HTML5 + CDN Tailwind/Alpine to a Wealth Engine–aligned stack: Next.js App Router, Tailwind v4, TypeScript, Supabase, TanStack Query.

### Decisions
- Preserve antique / Old West brand (crimson, charcoal, gold, parchment) rather than inventing a new palette.
- Typography: Playfair Display + Rye (spurred display) + Merriweather via `next/font`.
- Offline-first: seed data + `localStorage` cache when Supabase is unset or unreachable; admin writes require cloud.
- RLS: public SELECT on content tables; writes gated by `profiles.is_admin` through `SECURITY DEFINER` helper.
- Hero centers organizational graphic in a gold/aged frame (`public/assets/hero-logo.jpg` from `IMG_2160.JPG`).
- Retired static `index.html` / `404.html` moved to `archive/`.

### Deliverables
App routes (`/`, `/about`, `/plaques`, `/events`, `/admin`), gallery + events board components, admin CRUD dashboard, migration SQL, docs.

### Verification
`npm run typecheck` and `npm run build` both succeeded.

---

## 2026-07-18 — Phase 1 site launch (static)

Shipped a production-ready single-page site for Homeless Twenty 1904.

### Decisions
- Single-page architecture: content footprint is small; Events/Pre-Pay benefit from one scroll path.
- CDN Tailwind + Alpine: zero build step for easy lodge handoff and static hosting.
- Brand-first hero with full-bleed western imagery; Events as primary CTA.
- Plaque gallery uses Alpine lightbox; event cards include Pre-Pay modules ready for Stripe URLs.
- Contact form targets Formspree placeholder with client-side validation.

### Brand system
Crimson `#990000`, charcoal `#111111`, gold `#D4AF37`, slate `#4A5568`, parchment `#FAFAF5`. Playfair Display + Merriweather.

### Deliverables
`index.html`, `404.html`, `favicon.svg`, `robots.txt`, `sitemap.xml`, `README.md`.
