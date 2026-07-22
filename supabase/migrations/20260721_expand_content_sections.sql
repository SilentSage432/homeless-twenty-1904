-- Seed expanded CMS page copy for About / Home / Events / Contact.
-- Safe to re-run: ON CONFLICT DO NOTHING preserves steward edits.

INSERT INTO public.site_content_sections (slug, title, content)
VALUES
  (
    'about_hero',
    'About Homeless Twenty 1904',
    'Guardians of Magic Valley lore and western heritage across Southern and Eastern Idaho.'
  ),
  (
    'about_mission',
    'Guardians of Magic Valley Lore',
    'Homeless Twenty 1904 is a historical society interested in raising awareness of western heritage in Southern and Eastern Idaho. We focus heavily on preserving Eastern Idaho and Magic Valley history through community engagement, events, and the physical placement of historical markers and plaques that honor our region''s rich past.

We gather as neighbors and keepers of memory — educators, outdoor wanderers, long-time locals, and anyone who believes a plaque on a quiet roadside can outlast a generation of forgetting.'
  ),
  (
    'about_history',
    'Our History',
    'From early trail markers to present-day commemorations, the lodge preserves stories that shaped the Magic Valley — and invites every generation to keep the record alive.'
  ),
  (
    'home_intro',
    'Welcome',
    'Homeless Twenty 1904 preserves western heritage across Southern and Eastern Idaho — through plaques, gatherings, and the stories we refuse to forget.'
  ),
  (
    'home_heritage_callout',
    'Homeless Twenty 1904',
    'A region that remembers its trails will never lose its way.'
  ),
  (
    'events_intro',
    'Upcoming Events',
    'Join us for dinners, trail markers, and fellowship across the Magic Valley. Pre-pay when ready — secure payment links appear when each event opens.'
  ),
  (
    'contact_intro',
    'Contact the Lodge',
    'Questions about plaques, events, membership, or local history? Send a message to lodge leadership — we read every note.'
  )
ON CONFLICT (slug) DO NOTHING;
