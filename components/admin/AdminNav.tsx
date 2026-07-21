"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "🏛️" },
  { href: "/admin/settings", label: "Site Settings", icon: "📢" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "📥" },
  { href: "/admin/content", label: "Content & FAQs", icon: "📝" },
  { href: "/admin/documents", label: "Documents", icon: "📄" },
  { href: "/admin/database", label: "Database", icon: "🗄️" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="mb-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-2">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "focus-ring flex items-center gap-2 whitespace-nowrap border border-gold bg-gold/15 px-4 py-2.5 text-sm text-parchment"
                    : "focus-ring flex items-center gap-2 whitespace-nowrap border border-parchment/25 bg-charcoal/40 px-4 py-2.5 text-sm text-parchment/75 museum-ease hover:border-gold/50 hover:text-parchment"
                }
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
