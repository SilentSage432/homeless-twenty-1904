import Image from "next/image";

type HeroGraphicFrameProps = {
  src?: string;
  alt?: string;
  className?: string;
};

/**
 * Premium museum artifact frame — dual gold/charcoal edge,
 * warm bronze elevation shadow, fluid hover scale.
 * Full rectangular graphic (no crop masks).
 */
export function HeroGraphicFrame({
  src = "/assets/hero-logo.jpg",
  alt = "Homeless Twenty 1904 organizational graphic",
  className = "",
}: HeroGraphicFrameProps) {
  return (
    <figure className={`relative w-full max-w-lg mx-auto md:mx-0 md:ml-auto ${className}`}>
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-sm opacity-80"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(180, 83, 9, 0.22) 0%, rgba(120, 12, 12, 0.12) 40%, transparent 70%)",
        }}
      />

      <div
        className="
          group relative overflow-hidden bg-neutral-950
          border border-amber-600/30
          outline outline-4 outline-neutral-900/50
          shadow-[0_25px_60px_-15px_rgba(217,119,6,0.2)]
          transition-transform duration-700 ease-out
          hover:scale-[1.02]
          motion-reduce:transition-none
          motion-reduce:hover:scale-100
        "
      >
        <div className="border border-amber-700/20 p-1.5 sm:p-2">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1500}
            priority
            sizes="(max-width: 768px) 90vw, 480px"
            className="block h-auto w-full"
          />
        </div>
      </div>

      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}

/** @deprecated Prefer HeroGraphicFrame */
export const HeroOvalFrame = HeroGraphicFrame;
