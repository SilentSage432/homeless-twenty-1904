"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchNewInquiryCount } from "@/lib/supabase/cms";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "🏛️" },
  { href: "/admin/settings", label: "Site Settings", icon: "📢" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "📥" },
  { href: "/admin/content", label: "Content & FAQs", icon: "📝" },
  { href: "/admin/documents", label: "Documents", icon: "📄" },
  {
    href: "/admin/database",
    label: "Data browser",
    icon: "🗄️",
    title: "Browse plaques, events, and photos (advanced)",
  },
] as const;

type NavLink = (typeof LINKS)[number];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} new`}
      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-crimson px-1.5 py-0.5 text-[10px] font-semibold text-parchment"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [newInquiries, setNewInquiries] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchNewInquiryCount().then((n) => {
      if (!cancelled) setNewInquiries(n);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = LINKS.find((l) => l.href === pathname) ?? LINKS[0];
  const badgeFor = (link: NavLink) =>
    link.href === "/admin/inquiries" ? newInquiries : 0;

  return (
    <nav aria-label="Admin sections" className="mb-8">
      {/* Mobile (< md): dropdown showing the active section */}
      <div ref={wrapRef} className="relative md:hidden">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="admin-nav-mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="focus-ring flex w-full items-center justify-between gap-3 border border-parchment/25 bg-charcoal/50 px-4 py-3 text-left text-parchment"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true">{active.icon}</span>
            <span className="truncate">{active.label}</span>
            {active.href !== "/admin/inquiries" ? (
              <Badge count={newInquiries} />
            ) : null}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-gold transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open ? (
          <ul
            id="admin-nav-mobile-menu"
            role="menu"
            className="absolute z-40 mt-2 w-full overflow-hidden border border-parchment/25 bg-charcoal shadow-[var(--shadow-lift)]"
          >
            {LINKS.map((link) => {
              const isActive = link.href === pathname;
              return (
                <li key={link.href} role="none">
                  <Link
                    role="menuitem"
                    href={link.href}
                    title={"title" in link ? link.title : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "focus-ring flex min-h-[44px] items-center gap-2 border-l-2 border-gold bg-gold/15 px-4 py-3 text-sm text-parchment"
                        : "focus-ring flex min-h-[44px] items-center gap-2 border-l-2 border-transparent px-4 py-3 text-sm text-parchment/75 museum-ease hover:bg-white/5 hover:text-parchment"
                    }
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    <span className="flex-1">{link.label}</span>
                    <Badge count={badgeFor(link)} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {/* Desktop (>= md): horizontal tab bar */}
      <div className="hidden max-w-full overflow-x-auto md:block">
        <ul className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const isActive = link.href === pathname;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={"title" in link ? link.title : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "focus-ring flex min-h-[44px] items-center gap-2 whitespace-nowrap border border-gold bg-gold/15 px-4 py-2.5 text-sm text-parchment"
                      : "focus-ring flex min-h-[44px] items-center gap-2 whitespace-nowrap border border-parchment/25 bg-charcoal/40 px-4 py-2.5 text-sm text-parchment/75 museum-ease hover:border-gold/50 hover:text-parchment"
                  }
                >
                  <span aria-hidden="true">{link.icon}</span>
                  {link.label}
                  <Badge count={badgeFor(link)} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
