# Development Journal — Homeless Twenty 1904

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
