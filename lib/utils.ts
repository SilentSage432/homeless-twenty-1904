import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatEventDate(iso: string): {
  month: string;
  day: string;
  year: string;
  time: string;
  full: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { month: "—", day: "—", year: "—", time: "", full: iso };
  }

  return {
    month: d.toLocaleDateString("en-US", { month: "long" }),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    year: d.toLocaleDateString("en-US", { year: "numeric" }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
