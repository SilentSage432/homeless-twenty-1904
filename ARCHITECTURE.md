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
| Image uploads | `lib/supabase/storage.ts` → `uploadPlaqueAsset` / `uploadEventAsset` (both use bucket `plaque-assets`) |
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

- `admin` surface: Event Manager + Plaque Uploader + Personnel (assign admin|user only)
- `developer` surface: control-deck telemetry + content managers + Personnel (any role)
