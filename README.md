# Homeless Twenty 1904 — Website

Premium single-page site for **Homeless Twenty 1904**, a historical society preserving western heritage across Southern & Eastern Idaho and the Magic Valley.

**Tagline:** Preserving Western Heritage & Magic Valley History

## Stack

- HTML5 (semantic, accessible)
- [Tailwind CSS](https://tailwindcss.com/) via CDN
- [Alpine.js](https://alpinejs.dev/) via CDN (mobile nav, FAQ, plaque lightbox, form validation)
- Google Fonts: Playfair Display + Merriweather

No build step required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full single-page experience |
| `404.html` | Branded not-found page |
| `favicon.svg` | Lodge mark (H20 / 1904) |
| `robots.txt` | Crawler directives |
| `sitemap.xml` | Search index map |
| `README.md` | This file |

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

## Configuration before launch

1. **Formspree / Getform** — In `index.html`, replace `YOUR_FORM_ID` in the contact form `action` with your real endpoint.
2. **Domain** — Update canonical URL, Open Graph URLs, `robots.txt` sitemap, and `sitemap.xml` locs from `https://homelesstwenty1904.org/` to your live domain.
3. **Phone & email** — Replace the placeholder `(208) 555-1904` and `info@homelesstwenty1904.org` with lodge contacts.
4. **Social links** — Point Facebook / Instagram anchors to official profiles.
5. **Event pre-pay** — Set each event’s `payUrl` to your Stripe Payment Link (or bank URL) and `payReady: true` in the Alpine `events` array.
6. **Plaque photos** — Swap Unsplash placeholders for authentic marker photography; keep descriptive `alt` text.
7. **Hosting 404** — Point your host’s 404 handler to `404.html` (e.g. Netlify `_redirects`: `/* /404.html 404`).

## Sections

1. Hero — brand + “View Upcoming Events”
2. About / Mission — story, pillars, FAQ
3. Plaque Gallery — grid + Alpine lightbox
4. Events — timeline cards with Pre-Pay modules
5. Contact — validated outreach form
6. Footer — legal, explore, connect

## Brand tokens

| Token | Value |
|-------|-------|
| Crimson | `#990000` |
| Charcoal | `#111111` |
| Gold | `#D4AF37` |
| Slate | `#4A5568` |
| Parchment | `#FAFAF5` |

## Accessibility notes

- Skip link, semantic landmarks, labeled form fields
- Focus-visible gold rings on interactive controls
- High-contrast charcoal/crimson on parchment; gold used as accent
- Lightbox closes on Escape; body scroll locked while open
- `prefers-reduced-motion` disables decorative hero animations
- Body copy sized for comfortable reading (≈18px+)

## SEO targets

Optimized meta for:

- Homeless Twenty 1904
- Southeast Idaho Historical Society
- Magic Valley History Preservation

Includes Open Graph and Twitter Card tags.
