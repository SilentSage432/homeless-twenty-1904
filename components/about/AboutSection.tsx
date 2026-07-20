import Image from "next/image";

const PILLARS = [
  {
    title: "Raise Awareness",
    body: "Share the frontier stories of Southern and Eastern Idaho with the communities who live them.",
  },
  {
    title: "Place Markers",
    body: "Install and maintain physical historical plaques that honor people, places, and passages worth remembering.",
  },
  {
    title: "Gather Together",
    body: "Host dinners, outings, and commemorations that keep fraternal fellowship and local lore alive.",
  },
] as const;

export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 relative py-20 sm:py-28"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="ornament-rule mb-10 max-w-md mx-auto sm:mx-0" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
              Our Mission
            </p>
            <h2
              id="about-heading"
              className="font-display text-charcoal text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-6"
            >
              Guardians of Magic Valley Lore
            </h2>
            <div className="h-px w-16 bg-gold mb-8" aria-hidden="true" />
            <figure className="relative">
              <div className="relative w-full aspect-[4/5] border border-charcoal/10 shadow-[var(--shadow-panel)] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80"
                  alt="Rugged mountain landscape of the American West at dusk"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <figcaption className="mt-3 text-sm text-slate-weathered italic">
                The high country of Southern &amp; Eastern Idaho — land of trails,
                towns, and untold stories.
              </figcaption>
            </figure>
          </div>

          <div className="lg:col-span-7">
            <p className="drop-cap font-body text-lg sm:text-[1.125rem] leading-[1.85] text-parchment-ink/90 mb-6">
              Homeless Twenty 1904 is a historical society interested in raising
              awareness of western heritage in Southern and Eastern Idaho. We
              focus heavily on preserving Eastern Idaho and Magic Valley history
              through community engagement, events, and the physical placement of
              historical markers and plaques that honor our region&apos;s rich past.
            </p>
            <p className="font-body text-lg leading-[1.85] text-parchment-ink/85 mb-10">
              We gather as neighbors and keepers of memory — educators, outdoor
              wanderers, long-time locals, and anyone who believes a plaque on a
              quiet roadside can outlast a generation of forgetting.
            </p>

            <ul className="space-y-6 border-l-2 border-crimson/30 pl-6" role="list">
              {PILLARS.map((pillar) => (
                <li key={pillar.title}>
                  <h3 className="font-display text-xl text-charcoal font-semibold mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-base leading-relaxed text-slate-weathered">
                    {pillar.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
