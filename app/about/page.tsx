import type { Metadata } from "next";
import { AboutSection } from "@/components/about/AboutSection";
import { CmsText } from "@/components/CmsText";
import { FaqAccordion } from "@/components/FaqAccordion";
import { DocumentDownloadList } from "@/components/DocumentDownloadList";
import { getContentSection } from "@/lib/supabase/cms";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Homeless Twenty 1904 — guardians of Magic Valley lore and western heritage across Southern and Eastern Idaho.",
};

export const revalidate = 30;

export default async function AboutPage() {
  const [hero, president] = await Promise.all([
    getContentSection("about_hero"),
    getContentSection("president-message"),
  ]);

  return (
    <div className="pt-20">
      <section
        className="border-b border-charcoal/10 bg-parchment-warm/60 py-14 sm:py-16"
        aria-labelledby="about-hero-heading"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
            About Us
          </p>
          <h1
            id="about-hero-heading"
            className="font-display text-charcoal text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-5"
          >
            {hero.title}
          </h1>
          <div className="mx-auto mb-5 h-px w-16 bg-gold" aria-hidden="true" />
          <CmsText
            content={hero.content}
            className="font-body text-lg leading-relaxed text-slate-weathered"
          />
        </div>
      </section>

      <AboutSection showHistory />

      {president.content.trim() ? (
        <section
          className="scroll-mt-24 bg-charcoal py-16 sm:py-20"
          aria-labelledby="president-heading"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-gold text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
              From the Lodge
            </p>
            <h2
              id="president-heading"
              className="font-display text-parchment text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-6"
            >
              {president.title || "A Word from the President"}
            </h2>
            <CmsText
              content={president.content}
              className="cms-prose font-body text-lg leading-[1.85] text-parchment/85 space-y-6"
            />
          </div>
        </section>
      ) : null}

      <FaqAccordion />
      <DocumentDownloadList />
    </div>
  );
}
