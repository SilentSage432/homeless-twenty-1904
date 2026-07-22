import Link from "next/link";
import { HeroSection } from "@/components/hero/HeroSection";
import { AboutSection } from "@/components/about/AboutSection";
import { PlaquesGallery } from "@/components/plaques/PlaquesGallery";
import { EventsBoard } from "@/components/events/EventsBoard";

// Revalidate so CMS-managed hero/about copy refreshes without a redeploy.
export const revalidate = 30;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <aside
        className="bg-charcoal text-parchment py-14 sm:py-16"
        aria-label="Heritage statement"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="ornament-rule mb-8 max-w-xs mx-auto" aria-hidden="true">
            <span className="ornament-diamond" />
          </div>
          <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl leading-snug italic text-parchment">
            “A region that remembers its trails will never lose its way.”
          </blockquote>
          <p className="mt-6 text-sm tracking-[0.2em] uppercase text-gold">
            Homeless Twenty 1904
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
      <EventsBoard />
    </>
  );
}
