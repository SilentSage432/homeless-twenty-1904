import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-charcoal-soft border-t border-gold/20 text-parchment py-14"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="font-display text-2xl text-parchment mb-2">
              Homeless Twenty <span className="text-gold">1904</span>
            </p>
            <p className="text-sm tracking-[0.15em] uppercase text-gold/90 mb-4">
              Preserving Western Heritage &amp; Magic Valley History
            </p>
            <p className="font-body text-base leading-relaxed text-parchment/70 max-w-md">
              A historical society dedicated to raising awareness, safeguarding
              local lore, and preserving the rugged western heritage of Southern
              and Eastern Idaho.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gold mb-4">
              Explore
            </p>
            <ul className="space-y-2 font-body text-base">
              <li>
                <Link href="/#about" className="focus-ring text-parchment/80 hover:text-gold">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#plaques" className="focus-ring text-parchment/80 hover:text-gold">
                  Plaque Gallery
                </Link>
              </li>
              <li>
                <Link href="/#events" className="focus-ring text-parchment/80 hover:text-gold">
                  Events
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gold mb-4">
              Connect
            </p>
            <ul className="space-y-2 font-body text-base">
              <li>
                <a
                  href="mailto:info@homelesstwenty1904.org"
                  className="focus-ring text-parchment/80 hover:text-gold"
                >
                  Email the Lodge
                </a>
              </li>
              <li>
                <Link href="/admin" className="focus-ring text-parchment/55 hover:text-gold text-sm">
                  Steward login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="ornament-rule max-w-sm mx-auto mb-8" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-parchment/55">
          <p>&copy; {year} Homeless Twenty 1904. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Southeast Idaho Historical Society · Magic Valley History Preservation
          </p>
        </div>
      </div>
    </footer>
  );
}
