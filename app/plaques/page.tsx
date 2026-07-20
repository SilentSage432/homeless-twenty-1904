import type { Metadata } from "next";
import { PlaquesGallery } from "@/components/plaques/PlaquesGallery";

export const metadata: Metadata = {
  title: "Historical Plaques Gallery",
  description:
    "Browse historical plaques placed by Homeless Twenty 1904 across the Magic Valley and Eastern Idaho.",
};

export default function PlaquesPage() {
  return (
    <div className="pt-16">
      <PlaquesGallery />
    </div>
  );
}
