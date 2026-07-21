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

**Server**
- `POST /api/admin/stewards` → invite; `DELETE /api/admin/stewards` → `auth.admin.deleteUser` (no self-revoke; admins cannot revoke developers)
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

## Do not
- Do not put the service role key in `NEXT_PUBLIC_*`.
- Do not invent plaque/event facts.
- Do not let client RLS self-elevate `profiles.role`.
