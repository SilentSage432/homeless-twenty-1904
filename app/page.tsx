import Link from "next/link";
import { HeroSection } from "@/components/hero/HeroSection";
import { AboutSection } from "@/components/about/AboutSection";
import { PlaquesGallery } from "@/components/plaques/PlaquesGallery";
import { EventsBoard } from "@/components/events/EventsBoard";
import { CmsText } from "@/components/CmsText";
import { getContentSection } from "@/lib/supabase/cms";

export const revalidate = 30;

export default async function HomePage() {
  const [intro, heritage, eventsIntro] = await Promise.all([
    getContentSection("home_intro"),
    getContentSection("home_heritage_callout"),
    getContentSection("events_intro"),
  ]);

  return (
    <>
      <HeroSection />

      {intro.content.trim() ? (
        <section
          className="border-b border-charcoal/10 bg-parchment py-12 sm:py-14"
          aria-labelledby="home-intro-heading"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            {intro.title.trim() ? (
              <h2
                id="home-intro-heading"
                className="font-display text-charcoal text-2xl sm:text-3xl font-semibold mb-4"
              >
                {intro.title}
              </h2>
            ) : (
              <h2 id="home-intro-heading" className="sr-only">
                Welcome
              </h2>
            )}
            <CmsText
              content={intro.content}
              className="font-body text-lg leading-relaxed text-slate-weathered"
            />
          </div>
        </section>
      ) : null}

      <AboutSection />
      <aside
        className="bg-charcoal text-parchment py-14 sm:py-16"
        aria-label="Heritage statement"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="ornament-rule mb-8 max-w-xs mx-auto" aria-hidden="true">
            <span className="ornament-diamond" />
          </div>
          <CmsText
            as="blockquote"
            content={
              heritage.content.trim()
                ? `“${heritage.content.replace(/^["“]|["”]$/g, "")}”`
                : "“A region that remembers its trails will never lose its way.”"
            }
            className="font-display text-2xl sm:text-3xl md:text-4xl leading-snug italic text-parchment"
          />
          <p className="mt-6 text-sm tracking-[0.2em] uppercase text-gold">
            {heritage.title.trim() || "Homeless Twenty 1904"}
          </p>
        </div>
      </aside>
      <PlaquesGallery />
      <div className="bg-parchment-warm/50 pb-16 sm:pb-20 -mt-6 sm:-mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-body text-base sm:text-lg text-slate-weathered mb-6 max-w-xl mx-auto">
            See where each marker stands across the Magic Valley — open the
            interactive map with location pins.
          </p>
          <Link
            href="/plaques?view=map"
            className="focus-ring btn-primary inline-flex min-h-[44px] items-center gap-2 px-7 py-3.5 text-base tracking-wide"
          >
            Explore Interactive Plaque Map ↗
          </Link>
        </div>
      </div>
      <EventsBoard
        introTitle={eventsIntro.title}
        introBody={eventsIntro.content}
      />
    </>
  );
}
