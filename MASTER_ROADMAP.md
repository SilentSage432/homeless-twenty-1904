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
- [x] In-app Contact Lodge modal + `/api/contact` (Resend, honeypot, reply-to) — replaces mailto links
- [x] Database & Schema Portal (`/admin/database`): mobile-first Tables / Storage Assets / SQL Console (developer-gated `/api/admin/query`)
- [x] CMS & Operational Control Suite: Site Settings/banner, Inquiry Inbox, Content & FAQ editor, Public Documents; public announcement banner + FAQ/documents; feature flags
- [x] Resilience & performance: on-demand revalidation on CMS saves, content revision history + one-click undo, client-side WebP image compression, JSON data-snapshot export, contact email alert + ack payload
- [x] Canonical `AdminToggle` primitive (vertically-centered switch, `role="switch"`, single owner) — replaces the ad-hoc settings toggle
- [x] Full repo audit polish: steward-facing helper/confirm copy, modal a11y baseline (`useModalA11y`), tap targets, dead-export cleanup
- [x] Typecheck + production build green

## Near-term
- [ ] Wire live Supabase project + role elevation + run SQL migrations
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` for steward invites / storage setup
- [ ] Apply `supabase/migrations/20260720_admin_exec_sql.sql` (developer SQL console) to the live DB
- [ ] Apply `supabase/migrations/20260721_site_settings_and_cms.sql` (CMS suite + lodge-documents bucket) to the live DB
- [ ] Apply `supabase/migrations/20260721_content_revisions.sql` (content revision history) to the live DB
- [ ] Final hero-oval historic photograph drop-in
- [ ] Authentic plaque photography via dashboard uploads
- [ ] Stripe Payment Links on events
- [x] Contact / submissions surface (in-app modal + Resend)
- [ ] Production domain + HTTPS deploy

## Later
- [ ] Map view of plaque locations
- [ ] Membership / dues flow
- [ ] Photo archive / oral history pages
- [ ] PWA service worker (parity with Wealth Engine offline shell)
