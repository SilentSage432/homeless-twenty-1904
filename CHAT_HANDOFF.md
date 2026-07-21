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

**Server**
- `POST /api/admin/stewards` → invite; `DELETE /api/admin/stewards` → `auth.admin.deleteUser` (no self-revoke; admins cannot revoke developers)
- Storage verify uses `storage.from('plaque-assets').list`
- Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

## Next human steps
1. Confirm `.env.local` has URL, anon key, and service role key.
2. Invite stewards from Component D; publish content via A/B forms.
3. Confirm `plaque-assets` migration applied.
4. Apply `supabase/migrations/20260720_events_image_url.sql` (adds `events.image_url`) to the live DB.

## Do not
- Do not put the service role key in `NEXT_PUBLIC_*`.
- Do not invent plaque/event facts.
- Do not let client RLS self-elevate `profiles.role`.
