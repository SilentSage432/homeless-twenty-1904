import type { Metadata } from "next";
import { AboutSection } from "@/components/about/AboutSection";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Homeless Twenty 1904 — guardians of Magic Valley lore and western heritage across Southern and Eastern Idaho.",
};

export default function AboutPage() {
  return (
    <div className="pt-20">
      <AboutSection />
    </div>
  );
}
