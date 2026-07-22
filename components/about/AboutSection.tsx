import Image from "next/image";
import { CmsText } from "@/components/CmsText";
import { getContentSection } from "@/lib/supabase/cms";

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

export async function AboutSection({
  showHistory = false,
}: {
  /** When true (About page), also render the History block. */
  showHistory?: boolean;
}) {
  const mission = await getContentSection("about_mission");
  const history = showHistory
    ? await getContentSection("about_history")
    : null;

  return (
    <section
      id="about"
      className="scroll-mt-24 relative py-20 sm:py-28"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              className="font-display text-charcoal text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-6"
            >
              {mission.title || "Guardians of Magic Valley Lore"}
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
            <CmsText
              content={mission.content}
              className="cms-prose font-body text-lg leading-[1.85] text-parchment-ink/90 mb-10 space-y-6"
            />

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

            {history && history.content.trim() ? (
              <div className="mt-12 border-t border-charcoal/10 pt-10">
                <h3 className="font-display text-2xl text-charcoal font-semibold mb-4">
                  {history.title || "Our History"}
                </h3>
                <CmsText
                  content={history.content}
                  className="cms-prose font-body text-lg leading-[1.85] text-parchment-ink/85 space-y-4"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
