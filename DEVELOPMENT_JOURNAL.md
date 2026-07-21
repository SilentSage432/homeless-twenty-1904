# Development Journal — Homeless Twenty 1904

## 2026-07-21 — Platform resilience & performance upgrades

- **Instant on-demand revalidation**: new staff-gated `POST /api/admin/revalidate` (Node runtime, `requireStaffRequest`, path allowlist `/ · /about · /plaques · /events`) calls `revalidatePath`. Client helper `requestRevalidate()` in `staff-api.ts` (best-effort, never throws) is fired after every CMS save — `SiteSettingsManager` (banner/lodge/flags), `ContentManager` hero + section + FAQ mutations — so public pages update immediately instead of waiting on the 30s ISR window.
- **Content revision history & one-click undo**: migration `20260721_content_revisions.sql` (`content_revisions`: id/section_slug/content/created_at/created_by, staff-only RLS via `can_manage_content()`). `upsertSection` now snapshots the prior content into `content_revisions` before overwriting (single ownership in `cms.ts`); added `fetchRevisions(slug)`. `ContentManager` gains a **Revision history** modal per section (newest-first list, plaintext preview, Escape/backdrop close) with one-click **Restore** — restoring re-saves (which itself snapshots the current state, so restores are reversible).
- **Client-side image compression**: new `lib/utils/imageCompressor.ts` — canvas scale to ≤1920px + WebP re-encode at 0.82 quality, passthrough for GIF/SVG, keeps original if compression doesn't help, never throws. Wired into the shared `uploadImageAsset` path in `storage.ts`, so all plaque/event uploads shrink before hitting Supabase Storage (size check now runs on the compressed file; `.webp` extension + contentType).
- **Database backup exporter**: `DatabasePortalShell` gains an **Export Site Data Snapshot (JSON)** button that queries `plaques · site_settings · site_content_sections · faqs · public_documents` (browser client, public-read RLS) and downloads `homelesstwenty-snapshot-YYYY-MM-DD.json` with metadata header.
- **Transactional email alert**: `/api/contact` staff alert email already fires on every logged inquiry; responses now carry a clean `message` acknowledgment payload (`ACK_MESSAGE`) consumed by `ContactModal`'s success screen.
- Typecheck + lint + production build green.

---

## 2026-07-21 — Navigation UX refinement

- `AdminNav`: replaced the mobile horizontal overflow bar with a custom dropdown showing the active section (icon + label + chevron); tapping reveals a vertical menu of all six routes with icons and a live **new-inquiries badge** (`fetchNewInquiryCount`, staff RLS). Desktop keeps the wrapping horizontal tab bar. Closes on route change, outside click, and Escape; zero horizontal scroll on mobile.
- `SiteHeader` (the site navbar; project has no `components/Navbar.tsx`): staff detection via `getCurrentUserRole()` (no query for anon). Desktop shows a subtle gold **"Admin Cockpit"** pill (shield/key icon) only when authenticated staff. Mobile drawer gains a discrete **"Steward Portal"** link (→ `/admin` unauth, `/admin/dashboard` staff → labeled "Admin Cockpit") in a divided section below the public links. Footer link unchanged.
- Typecheck + lint + build green.

---

## 2026-07-21 — CMS & Operational Control Suite

- **Schema** (`20260721_site_settings_and_cms.sql`): `site_settings` (singleton `global` row with `announcement_banner` / `lodge_info` / `hero_config` / `feature_flags` jsonb), `site_content_sections` (slug-keyed HTML blocks, seeded `about-lore` + `president-message`), `faqs`, `inquiries`, `public_documents`, plus a public `lodge-documents` storage bucket. RLS: public read for settings/sections/documents + published faqs; staff (admin/developer) full write; inquiries staff-only (public submissions persist via the service-role contact route). Hero/about defaults seeded to current copy so nothing changes until edited.
- **Types + data access**: `database.types.ts` gained the 5 tables + config interfaces (`AnnouncementBanner`, `LodgeInfo`, `HeroConfig`, `FeatureFlags`, `InquiryStatus`). New `lib/supabase/cms.ts` owns all reads/writes (settings, sections, faqs, inquiries, documents) + `uploadDocumentFile` and default/merge helpers.
- **Admin**: shared `AdminNav` (📢 Settings · 📥 Inquiries · 📝 Content · 📄 Documents · 🗄️ Database · 🏛️ Dashboard) added to every admin shell. New `AdminPageShell` (client gate reusing `requireStaffSession`, optional `requireDeveloper`) wraps four new pages:
  - `/admin/settings` — `SiteSettingsManager`: banner + lodge info + feature-flag toggles with a **live banner preview** (shares `AnnouncementBannerView`).
  - `/admin/inquiries` — `InquiryInbox`: filterable table (new/replied/archived), Mark Replied, Archive/Restore, editable internal notes.
  - `/admin/content` — `ContentManager`: Hero Manager, Section Editor (HTML), FAQ Manager (add/edit/publish/reorder/delete).
  - `/admin/documents` — `DocumentManager`: upload to `lodge-documents` + title/category, list + remove.
- **Public**: `AnnouncementBanner` (fixed, dismissible per session, publishes `--ann-height` so the fixed header + `main` offset cleanly; hidden on `/admin`) rendered at the top of `layout.tsx`. `FaqAccordion` + `DocumentDownloadList` surfaced on `/about` (+ optional `president-message` block). `HeroSection` and `AboutSection` are now async and consume `hero_config` / `about-lore` with exact-copy fallbacks; `/` and `/about` use `revalidate = 30` (ISR) so edits appear without a redeploy.
- **Feature flags wired**: `/api/contact` now persists every submission to `inquiries` via the service-role client and rejects with a friendly 403 when `allow_inquiries` is off (message still saved if email is unconfigured). `PlaquesExplorer` hides the Map toggle when `show_interactive_map` is off. `allow_rsvps` is stored/editable.
- Typecheck + lint + production build green (20 routes; 4 new admin pages ~211 kB first load).

---

## 2026-07-20 — SQL Console UX upgrade

- `SqlConsole.tsx`: client-side `sanitizeQuery()` trims and strips trailing semicolons before POST, so Postgres subquery wrapping in `admin_exec_sql` never hits a syntax error.
- Run button now shows an inline spinner + "Running…" and disables (also disabled when the sanitized query is empty) to prevent duplicate submits.
- Write/DDL success renders a prominent green banner ("Query executed successfully · N rows affected") and clears the textarea. Read results render in a horizontally-scrollable data table with a "Results (N rows)" header + column count and zebra striping. Errors render in a red left-bordered banner showing the exact Postgres message (+ optional hint).
- Typecheck + lint green.

---

## 2026-07-20 — Database & Schema Management Portal (`/admin/database`)

- New protected route `app/admin/database/page.tsx` (noindex) + client shell `components/admin/DatabasePortalShell.tsx`. Gate reuses `requireStaffSession()` (admin/developer; `user`/anon bounced to `/admin`). Responsive nav: `<select>` dropdown on mobile, segmented tab bar on `sm+`, switching **Tables / Storage Assets / SQL Console**. The SQL tab is developer-only (hidden for admins, with a fallback effect if selected).
- `components/admin/TableExplorer.tsx`: per-table config for `plaques`/`events`/`profiles`. Limit/offset pagination (fetch `PAGE_SIZE+1` to detect "more"), stacked cards showing primary key + title/name + timestamp (`date_placed`/`created_at`/`updated_at`) + key metadata. Plaques & events get a **Quick Edit** modal and **Delete** (browser client, RLS staff writes). **Ownership (Rule 4):** profiles are read-only here — no delete RLS policy and personnel is owned by `StewardManagementPanel`; a note points there.
- `components/admin/StorageInspector.tsx`: lists `plaque-assets` via the browser Storage API (public read + staff delete RLS), thumbnail grid + human file size + **Delete Asset** (confirm → `remove`). Paginated via `list({ limit, offset })`.
- `components/admin/SqlConsole.tsx` + `app/api/admin/query/route.ts`: developer-only emergency executor. Route uses `requireDeveloperRequest` (JWT verified server-side) then service-role `rpc('admin_exec_sql', { query })`. Migration `20260720_admin_exec_sql.sql` defines that SECURITY DEFINER function — reads are wrapped/aggregated to JSON rows, writes/DDL report affected count — with EXECUTE revoked from anon/authenticated and granted only to `service_role`, so the browser client can never reach it. UI renders row results as a table and confirms before write/DDL. Added `admin_exec_sql` to `database.types.ts` Functions.
- Dashboard integration: added a **Database** link beside Sign out in `AdminDashboardShell` header.
- Typecheck + lint + production build green (`/admin/database` first-load JS ~212 kB; `/api/admin/query` dynamic).

---

## 2026-07-20 — In-app Contact Lodge modal + Resend API

- New `app/api/contact/route.ts` (POST, node runtime): validates name/email/subject/message (phone optional), honeypot → silent success, sends via `resend` to `RESEND_TARGET_EMAIL` (default `info@thehomelesstwenty1904.org`) with `replyTo` = sender. Friendly 503 when `RESEND_API_KEY` unset; 400/502 for validation/provider errors. HTML is escaped.
- New `components/contact/`: `ContactModal.tsx` (vintage brass/parchment modal — Name/Email/Subject-category/Phone/Message + hidden honeypot; idle→sending→success/error states, autofocus first field, ESC + backdrop close, body scroll lock), `ContactModalContext.tsx` (single shared instance via `useContactModal().open(subject?)`), `ContactButton.tsx` (client trigger for server components).
- `ContactModalProvider` wraps the app in `providers.tsx`. Replaced the footer `mailto:` with a modal trigger; added "Contact" to header desktop+mobile nav; wired EventsBoard "contact the lodge" prompts (prefill subject "Event / RSVP"). No `mailto:` links remain in the app (only the archived static HTML).
- `.env.example` documents `RESEND_API_KEY`, `RESEND_TARGET_EMAIL`, `RESEND_FROM_EMAIL`. Typecheck + lint + build green.

---

## 2026-07-20 — Interactive Plaque Discovery Map + Grid/Map toggle

- New `components/plaques/PlaqueMap.tsx`: `@react-google-maps/api` map styled with a warm/vintage `VINTAGE_MAP_STYLES`. Fetches plaques, filters to non-null lat/lng, renders custom crimson+gold teardrop `MarkerF` pins, and auto-fits bounds. Marker click opens an `InfoWindowF` card (thumbnail, title, location, **View Details** → full modal, **Get Directions** → external Maps URL). Empty/loading/no-key states handled gracefully.
- **Composition (Rule 5):** extracted the full plaque modal into shared `components/plaques/PlaqueLightbox.tsx` — consumed by both the grid gallery and the map. Centralized Maps config in `lib/maps.ts` (`GOOGLE_MAPS_API_KEY`, loader id, libraries, `MAGIC_VALLEY_CENTER`, `VINTAGE_MAP_STYLES`, `isGoogleMapsConfigured`); `LocationAutocompleteField` now imports from it (single loader singleton).
- New `components/plaques/PlaquesExplorer.tsx` client wrapper owns the section/heading + a **[ Grid View | Map View ]** tablist toggle; `PlaquesGallery` gained a `bare` mode (grid + lightbox, no section) so it embeds cleanly. `app/plaques/page.tsx` now renders the explorer. Home page still uses the self-contained `PlaquesGallery`.
- Schema/admin (lat/lng columns + plaque write path) already delivered in the prior Location task — verified `ManagePlaquesForm` persists `latitude`/`longitude`.
- Typecheck + lint + build green (`/plaques` first-load JS 247 kB with Maps).

---

## 2026-07-20 — Location: Places Autocomplete + map preview + navigate buttons

- Added `@react-google-maps/api`. New shared `components/admin/LocationAutocompleteField.tsx`: Places Autocomplete input + live `<GoogleMap>`/`<Marker>` preview. On select it captures formatted address, lat/lng, and Google Maps `place.url` (or a constructed `search/?api=1&query=…` URL). **Graceful degradation:** renders a plain address input when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset or the loader errors, so forms stay usable.
- Schema: migration `20260720_location_maps.sql` adds `latitude double precision`, `longitude double precision`, `map_url text` to both tables, plus a `location text` to `events` (events had none). Reflected in init schema, `database.types.ts`, `fetchEvents`/`fetchPlaques` selects, and fallback seeds.
- Wired the field into Component A (Events Manager — optional) and Component B (Plaque Uploader — required); both persist location + coords + map_url.
- Public: `lib/utils.ts` `buildMapUrl()` (prefers `map_url` → lat/lng → address). EventsBoard shows the location + a "View on Map" link; plaque lightbox shows a "Navigate / View on Map" button. One-tap GPS on mobile.
- `.env.example` documents `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Typecheck + lint + build green (`/admin/dashboard` first-load JS 259 kB with Maps).

---

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
