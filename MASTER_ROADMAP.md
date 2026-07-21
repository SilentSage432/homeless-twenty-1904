# Master Roadmap — Homeless Twenty 1904

## Done
- [x] Static Phase 1 site (HTML5 / Alpine) — archived
- [x] Next.js App Router + Tailwind v4 + TypeScript scaffold
- [x] Antique / Old West theme tokens + Playfair / Rye / Merriweather
- [x] `public/assets/hero-logo.jpg` hero frame
- [x] Supabase schema + RLS migration (`profiles`, `events`, `plaques`)
- [x] Layout nav: Home, About Us, Plaques, Events
- [x] Plaques gallery + Events board (offline-first)
- [x] RBAC `profiles.role` (`developer` | `admin` | `user`) + staff RLS
- [x] Developer System Overrides panel on `/admin/dashboard`
- [x] Developer cockpit visual overhaul + steward invite API
- [x] Admin + developer personnel invites; live event/plaque edit-delete rosters
- [x] Invite email flow: production redirect + /auth/callback + password activation
- [x] Responsive & mobile polish pass (320px → wide, 44px touch targets)
- [x] Plaque Uploader in-browser crop + rotate (react-easy-crop + image resizer, 4:3, client-side blob)
- [x] Optional event images (shared crop editor, `events.image_url`, admin thumbs + public banner)
- [x] Location: Places Autocomplete + map preview (events/plaques lat/lng/map_url) + public navigate buttons
- [x] Interactive Plaque Discovery Map (`/plaques` Grid|Map toggle, custom pins, InfoWindow, directions)
- [x] Typecheck + production build green

## Near-term
- [ ] Wire live Supabase project + role elevation + run SQL migrations
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` for steward invites / storage setup
- [ ] Final hero-oval historic photograph drop-in
- [ ] Authentic plaque photography via dashboard uploads
- [ ] Stripe Payment Links on events
- [ ] Contact / submissions surface
- [ ] Production domain + HTTPS deploy

## Later
- [ ] Map view of plaque locations
- [ ] Membership / dues flow
- [ ] Photo archive / oral history pages
- [ ] PWA service worker (parity with Wealth Engine offline shell)
