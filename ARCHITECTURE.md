# Architecture — Homeless Twenty 1904

Layered ownership aligned with the Wealth Engine hybrid stack. Presentation renders; content composition reads from Supabase or offline seed; infrastructure never invents institutional history.

## Layers

```text
Presentation (app/*, components/*)
        ↓
Application (TanStack Query + admin forms)
        ↓
Persistence (lib/supabase/content.ts + localStorage cache)
        ↓
Infrastructure (Supabase client, Next.js, Tailwind)
```

## Ownership

| Concern | Owner |
|---------|-------|
| Visual brand / layout | `app/globals.css`, `components/layout/*`, `components/hero/*` |
| Public content surfaces | `components/plaques/*`, `components/events/*`, `components/about/*` |
| Auth + admin gate | `lib/supabase/auth.ts`, `components/admin/AdminLoginForm.tsx`, `AdminDashboardShell.tsx` |
| Developer admin APIs | `lib/supabase/admin.ts` + `app/api/admin/*` (service role; never client) |
| Steward invites / roster | `components/admin/StewardManagementPanel.tsx` → `POST /api/admin/stewards` |
| Event / plaque forms | `components/admin/ManageEventsForm.tsx`, `ManagePlaquesForm.tsx` |
| Image crop/rotate editor | `components/admin/ImageCropEditor.tsx` (shared by plaque + event uploaders) → `lib/utils/crop-image.ts` (canvas + resizer → JPEG blob) |
| Image uploads | `lib/supabase/storage.ts` → `uploadPlaqueAsset` / `uploadEventAsset` (both use bucket `plaque-assets`); compressed client-side via `lib/utils/imageCompressor.ts` (≤1920px WebP @0.82) before upload |
| Location + maps | `components/admin/LocationAutocompleteField.tsx` (Places Autocomplete + preview) → `events`/`plaques` `latitude`/`longitude`/`map_url`; public nav via `buildMapUrl()` in `lib/utils.ts`. Shared Maps config in `lib/maps.ts`. Needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. |
| Plaque discovery map | `components/plaques/PlaqueMap.tsx` + `PlaquesExplorer.tsx` (Grid/Map toggle); shared detail modal `PlaqueLightbox.tsx` |
| Contact lodge | `components/contact/*` (modal + `ContactModalProvider` + `ContactButton`) → `POST /api/contact` (Resend). Needs `RESEND_API_KEY`. |
| Database portal | `app/admin/database/page.tsx` + `DatabasePortalShell.tsx` (Tables / Storage / SQL tabs). `TableExplorer.tsx` (RLS reads/writes; profiles read-only), `StorageInspector.tsx` (`plaque-assets`), `SqlConsole.tsx` → `POST /api/admin/query` (developer-only) → service-role `rpc('admin_exec_sql')` (`supabase/migrations/20260720_admin_exec_sql.sql`). |
| CMS suite | `AdminNav.tsx` + `AdminPageShell.tsx` gate `/admin/{settings,inquiries,content,documents}`. Managers: `SiteSettingsManager`, `InquiryInbox`, `ContentManager` (hero/sections/FAQs), `DocumentManager`. Data access in `lib/supabase/cms.ts`; schema `supabase/migrations/20260721_site_settings_and_cms.sql`. |
| Public CMS output | `AnnouncementBanner.tsx` (layout top, dismissible), `FaqAccordion.tsx`, `DocumentDownloadList.tsx`; `HeroSection`/`AboutSection` consume `hero_config`/`about-lore` (ISR `revalidate=30`). Feature flags gate contact + plaque map. |
| Instant publish | CMS saves call `requestRevalidate()` (`lib/supabase/staff-api.ts`) → `POST /api/admin/revalidate` (`requireStaffRequest`, allowlist) → `revalidatePath('/' / '/about' / '/plaques')`. |
| Content revisions | `content_revisions` (`supabase/migrations/20260721_content_revisions.sql`, staff RLS). `upsertSection` snapshots prior content; `fetchRevisions` + `ContentManager` Revision-history modal restore. |
| Data snapshot export | `DatabasePortalShell.tsx` "Export Site Data Snapshot (JSON)" → downloads `plaques`/`site_settings`/`site_content_sections`/`faqs`/`public_documents`. |
| System telemetry | `components/admin/SystemOverridesPanel.tsx` |
| Schema + RLS + storage | `supabase/migrations/*` |
| Typed DB contracts | `lib/supabase/database.types.ts` |
| Plaque file uploads | `lib/supabase/storage.ts` → bucket `plaque-assets` |
| Offline seed / cache | `lib/data/fallback.ts` |

## Offline-first policy

1. If Supabase env is present → fetch `events` / `plaques`, write `localStorage` cache.
2. If fetch fails → serve cache when available.
3. If no cache → serve compile-time seed rows (same narrative as the retired static site).

Admin mutations require a live Supabase session whose `profiles.role` is `admin` or `developer`. They do not invent local write-back for institutional records.

## Admin write path

`/admin` → email/password Auth → `profiles.role` RBAC check → CRUD via RLS (`can_manage_content()`) on `events` and `plaques`.

- `admin` surface: Event Manager + Plaque Uploader + Personnel (assign admin|user only) + Database portal (Tables + Storage)
- `developer` surface: control-deck telemetry + content managers + Personnel (any role) + Database portal (Tables + Storage + SQL Console)
