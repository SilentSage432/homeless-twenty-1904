import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-28 pb-24 px-4 text-center">
      <p className="text-crimson text-xs tracking-[0.22em] uppercase mb-3">
        Trail Lost
      </p>
      <h1 className="font-western text-4xl sm:text-5xl text-charcoal mb-4">
        404
      </h1>
      <p className="font-body text-lg text-slate-weathered max-w-md mx-auto mb-8">
        This path is not on our map. Return to the lodge hall and try another
        trail.
      </p>
      <Link
        href="/"
        className="focus-ring btn-primary inline-flex px-6 py-3 text-base tracking-wide"
      >
        Return Home
      </Link>
    </div>
  );
}
