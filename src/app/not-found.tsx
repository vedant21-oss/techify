import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-(--gutter) py-28 text-center">
      <p className="label-mono text-ink-soft">404</p>
      <h1 className="mt-4 text-6xl sm:text-7xl">That device isn&apos;t here</h1>
      <p className="mt-5 text-lg text-ink-soft">It may have been removed from the catalogue, or the link has a typo.</p>
      <Link href="/" className="mt-8 inline-block border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard">
        Back to the finder
      </Link>
    </div>
  );
}
