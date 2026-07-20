# Homeless Twenty 1904 — Website

Premium offline-first hybrid site for **Homeless Twenty 1904**, preserving western heritage across Southern & Eastern Idaho and the Magic Valley.

**Tagline:** Preserving Western Heritage & Magic Valley History

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Auth + Postgres + RLS)
- [TanStack Query](https://tanstack.com/query) (client cache)
- Google Fonts via `next/font`: Playfair Display, Rye, Merriweather

Mirrors the Wealth Engine hybrid pattern: cloud when configured, local seed + `localStorage` cache when offline.

## Quick start

```bash
cp .env.example .env.local   # add Supabase URL + anon key + service role key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, the public site still renders from offline seed data.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Hero, About, Plaques, Events |
| `/about` | About Us |
| `/plaques` | Historical Plaques Gallery |
| `/events` | Events board + pre-pay links |
| `/admin` | Steward login (redirects to dashboard) |
| `/admin/dashboard` | Protected Manage Events + Manage Plaques |

## Supabase setup

1. Create a project and run both SQL files in `supabase/migrations/` (schema, then `plaque-assets` bucket).
2. Create an Auth user for lodge stewards.
3. Elevate steward roles (and optional display name):

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Lodge Steward'
WHERE id = '<auth-user-uuid>';

-- or developer (unlocks System Telemetry on /admin/dashboard)
UPDATE public.profiles
SET role = 'developer', full_name = 'Platform Developer'
WHERE id = '<auth-user-uuid>';
```

4. Set `.env.local` from `.env.example` with your project URL + publishable/anon key.

RLS: public **read** on `events` / `plaques` and `plaque-assets`; **writes** when `role` is `admin` or `developer` (`can_manage_content()`). Role `user` is blocked from `/admin/dashboard`.

Dashboard isolation:
- `admin` — Event Manager + Plaque Uploader + Personnel (admin/user invites)
- `developer` — System Telemetry control deck + content forms + Personnel (any role)

Standard `user` roles cannot open the dashboard; payment URL fields and delete actions remain staff-only (`admin` / `developer`).

Steward invites and storage setup checks call server routes that require `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`).

## Assets

Place organizational graphics in `public/assets/`:

- `hero-oval.png` — centered oval historic photograph for the hero frame
- `hero-logo.jpg` — archive / alternate source graphic

## Brand tokens

| Token | Value |
|-------|-------|
| Crimson (primary) | `#990000` |
| Charcoal (accent black) | `#111111` |
| Gold | `#D4AF37` |
| Slate | `#4A5568` |
| Parchment | `#FAFAF5` |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Legacy static site

The previous HTML5 single-page build is preserved under `archive/`.
