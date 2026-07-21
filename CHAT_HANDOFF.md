# Chat Handoff — Homeless Twenty 1904

## Current state
Supabase RBAC live: `profiles` (`id`, `updated_at`, `full_name`, `role`), `events`, `plaques`.

**Dashboard**
- `developer`: telemetry control deck + events/plaques CRUD + personnel (any role)
- `admin`: events/plaques CRUD + personnel (admin/user only)
- Live event/plaque rosters with Edit/Delete (confirm + query invalidate + refresh); plaque thumbnails
- Payment URL + Delete are staff-only; `user` blocked from dashboard and from those controls
- Plaque Uploader + Events Manager share an in-browser crop+rotate flow (`react-easy-crop` + `react-image-file-resizer`): pick/drop → edit modal (4:3, zoom, rotate) → Confirm → cropped preview → save uploads the processed JPEG (1600×1200 @ q82) to `plaque-assets`. Crop logic in `lib/utils/crop-image.ts`; shared modal in `components/admin/ImageCropEditor.tsx`; uploads via `uploadPlaqueAsset` / `uploadEventAsset`.
- Events now support an **optional** `image_url` (migration `20260720_events_image_url.sql`). Admin roster shows thumbnails; public Events board renders a banner image when present, text-only fallback otherwise.
- Location fields use Google Places Autocomplete + map preview (`components/admin/LocationAutocompleteField.tsx`, `@react-google-maps/api`). Events gained `location`; both tables gained `latitude`/`longitude`/`map_url` (migration `20260720_location_maps.sql`). Public Event cards + plaque lightbox show a "View on Map / Navigate" button via `buildMapUrl()`. Needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS + Places APIs); degrades to plain text input without it.
- `/plaques` has a **Grid View | Map View** toggle (`PlaquesExplorer`). Map View = `PlaqueMap.tsx` (vintage-styled Google Map, custom pins, InfoWindow with thumbnail + View Details + Get Directions). Shared modal is `PlaqueLightbox.tsx`; Maps config centralized in `lib/maps.ts`.
- Contact is an in-app modal (`components/contact/*`), opened anywhere via `useContactModal().open()` or `<ContactButton>`. Header/footer/EventsBoard triggers replaced the old `mailto:`. `POST /api/contact` sends via `resend` (`replyTo` = sender) to `RESEND_TARGET_EMAIL`; honeypot spam trap. Needs `RESEND_API_KEY` + verified `RESEND_FROM_EMAIL`.

**Database Portal** (`/admin/database`, linked from dashboard header)
- Client gate reuses `requireStaffSession()` (admin/developer). Responsive shell `DatabasePortalShell.tsx`: mobile dropdown + tablet segmented tab bar switching Tables / Storage Assets / SQL Console.
- `TableExplorer.tsx` — paginated stacked cards for `plaques`/`events`/`profiles` (limit/offset, PAGE_SIZE 10). Plaques & events get Quick Edit modal + Delete via the browser client (RLS staff writes). Profiles are **read-only** here (no delete policy; manage via Personnel panel — single ownership).
- `StorageInspector.tsx` — lists `plaque-assets` objects via browser Storage API (public read + staff delete RLS), thumbnail grid, file size, Delete Asset.
- `SqlConsole.tsx` (developer tab only) — posts to `POST /api/admin/query`. Client sanitizes (trim + strip trailing `;`) before send. Run button shows a spinner + "Running…" and disables to block double-submits. Reads render in a scrollable data table headed "Results (N rows)"; write/DDL confirm → prominent green success banner + input cleared; errors surface in a red left-bordered banner with the exact Postgres message.

**CMS & Operational Control Suite** (`/admin` nav via `AdminNav`)
- Tables (migration `20260721_site_settings_and_cms.sql`): `site_settings` (singleton `global`: `announcement_banner`/`lodge_info`/`hero_config`/`feature_flags` jsonb), `site_content_sections` (seeded `about-lore`, `president-message`), `faqs`, `inquiries`, `public_documents` + public `lodge-documents` bucket. All reads/writes via `lib/supabase/cms.ts`.
- `/admin/settings` (`SiteSettingsManager`): announcement banner (with live preview), lodge info, feature-flag toggles. All switches use the canonical `AdminToggle` (in `components/admin/AdminUi.tsx`) — `role="switch"`, vertically-centered knob (`inline-flex items-center` track + `top-1/2 -translate-y-1/2` knob, `duration-200 ease-in-out`), optional `hint`/`disabled`, optional `showStatus` (“Live on site” / “Disabled”) + `previewHref` deep links. Feature Flags include steward-facing helper text and preview links to `/`, `/events`, `/plaques`. **Use `AdminToggle` for any new on/off control — it is the single toggle owner.**
- `/admin/inquiries` (`InquiryInbox`): triage new/replied/archived, edit internal notes.
- `/admin/content` (`ContentManager`): Hero Manager, Section Editor (HTML), FAQ Manager (add/edit/publish/reorder/delete).
- `/admin/documents` (`DocumentManager`): upload to `lodge-documents`, list/remove.
- Public: `AnnouncementBanner` (top of layout, dismissible per session, `--ann-height` offsets header/main; hidden on `/admin`); `FaqAccordion` + `DocumentDownloadList` + optional `president-message` on `/about`. `HeroSection`/`AboutSection` read `hero_config`/`about-lore` (async, `revalidate=30` on `/` + `/about`).
- Nav UX: `AdminNav` = mobile dropdown (active section + new-inquiry badge) / desktop tabs. `SiteHeader` shows an "Admin Cockpit" pill for staff on desktop and a "Steward Portal" link in the mobile drawer (staff detected via `getCurrentUserRole`).
- Feature flags: `allow_inquiries` gates `/api/contact` (persists to `inquiries` via service role; friendly 403 when off); `show_interactive_map` hides the `/plaques` map toggle; `allow_rsvps` stored.

**Resilience & performance**
- Instant publish: every CMS save calls `requestRevalidate()` (staff-api) → `POST /api/admin/revalidate` (`requireStaffRequest`, path allowlist) → `revalidatePath`, so `/ · /about · /plaques` update immediately (ISR `revalidate=30` remains as a safety net).
- Revision history: `content_revisions` (migration `20260721_content_revisions.sql`, staff-only RLS). `upsertSection` snapshots prior content before overwriting; `ContentManager` has a per-section **Revision history** modal with one-click Restore.
- Image compression: `lib/utils/imageCompressor.ts` (canvas → ≤1920px WebP @0.82, GIF/SVG passthrough) runs inside `uploadImageAsset`, so all plaque/event uploads are compressed before Storage.
- Backup export: Database portal **Export Site Data Snapshot (JSON)** downloads `plaques/site_settings/site_content_sections/faqs/public_documents`.
- Contact route returns a `message` acknowledgment consumed by `ContactModal`'s success screen; staff alert email fires on each logged inquiry.

**Server**
- `POST /api/admin/stewards` → invite; `DELETE /api/admin/stewards` → `auth.admin.deleteUser` (no self-revoke; admins cannot revoke developers)
- `POST /api/contact` → persists inquiry (service role) + emails via Resend; honors `allow_inquiries`
- `POST /api/admin/query` → `requireDeveloperRequest` + service-role `rpc('admin_exec_sql')`. Function is SECURITY DEFINER with EXECUTE revoked from anon/authenticated, granted only to `service_role` (migration `20260720_admin_exec_sql.sql`).
- Storage verify uses `storage.from('plaque-assets').list`
- Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

## Next human steps
1. Confirm `.env.local` has URL, anon key, and service role key.
2. Invite stewards from Component D; publish content via A/B forms.
3. Confirm `plaque-assets` migration applied.
4. Apply `supabase/migrations/20260720_events_image_url.sql` (adds `events.image_url`) to the live DB.
5. Apply `supabase/migrations/20260720_location_maps.sql` (location/lat/lng/map_url) to the live DB.
6. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local` (enable Maps JavaScript API + Places API; restrict by HTTP referrer).
7. Add `RESEND_API_KEY` + verify a sending domain in Resend; set `RESEND_FROM_EMAIL`/`RESEND_TARGET_EMAIL` (contact form).
8. Apply `supabase/migrations/20260720_admin_exec_sql.sql` to enable the developer SQL Console (`/admin/database`).
9. Apply `supabase/migrations/20260721_site_settings_and_cms.sql` to enable the CMS suite (site_settings/sections/faqs/inquiries/documents + `lodge-documents` bucket).
10. Apply `supabase/migrations/20260721_content_revisions.sql` to enable content revision history / one-click undo.

## Do not
- Do not put the service role key in `NEXT_PUBLIC_*`.
- Do not invent plaque/event facts.
- Do not let client RLS self-elevate `profiles.role`.
