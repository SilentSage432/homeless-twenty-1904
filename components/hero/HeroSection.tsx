import Link from "next/link";
import { HeroGraphicFrame } from "@/components/hero/HeroGraphicFrame";

export function HeroSection() {
  return (
    <section
      id="top"
      className="hero-asymmetric relative flex min-h-[100svh] scroll-mt-20 items-center overflow-hidden bg-[#0a0a0a] pt-20"
      aria-labelledby="hero-brand"
    >
      {/* Matte field + ambient crimson/bronze glow toward the artifact column */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 55% 60% at 78% 45%, rgba(180, 83, 9, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 45% 50% at 20% 40%, rgba(100, 10, 10, 0.22) 0%, transparent 60%),
            linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #12100e 100%)
          `,
        }}
      />

      <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Column 1 — mission copy + CTA */}
          <div className="animate-fade-rise order-2 md:order-1 text-center md:text-left">
            <p className="mb-5 font-semibold uppercase tracking-[0.2em] text-xs text-gold/85">
              Magic Valley Historical Society
            </p>

            <h1
              id="hero-brand"
              className="font-display text-parchment text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.2] tracking-wide max-w-xl mx-auto md:mx-0"
            >
              Guardians of Western Heritage across Southern &amp; Eastern Idaho
            </h1>

            <div
              className="mx-auto md:mx-0 mt-6 mb-7 h-px w-16 bg-gradient-to-r from-gold/90 to-transparent"
              aria-hidden="true"
            />

            <p className="font-body text-parchment/75 text-base sm:text-lg leading-[1.85] tracking-wide max-w-md mx-auto md:mx-0 mb-10">
              Preserving the rugged frontier history of the Magic Valley — one
              plaque, one gathering, one story at a time.
            </p>

            <div className="flex justify-center md:justify-start">
              <Link
                href="/#events"
                className="focus-ring btn-primary inline-flex w-fit items-center gap-2 px-7 sm:px-8 py-3.5 text-base sm:text-lg tracking-wide"
              >
                View Upcoming Events
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2 — framed organizational graphic */}
          <div className="animate-fade-rise-delay order-1 md:order-2 flex justify-center md:justify-end">
            <HeroGraphicFrame src="/assets/hero-logo.jpg" />
          </div>
        </div>
      </div>

      {/* Scroll seam — soft fade from matte hero into parchment below */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 z-[5]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(17, 17, 17, 0.35) 35%, rgba(250, 250, 245, 0.55) 78%, #fafaf5 100%)",
        }}
      />
    </section>
  );
}
