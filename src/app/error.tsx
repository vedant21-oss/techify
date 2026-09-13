"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-(--gutter) py-28 text-center">
      <h1 className="text-6xl sm:text-7xl">Something broke</h1>
      <p className="mt-5 text-lg text-ink-soft">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Recommendations couldn't load. Check your connection and try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard"
      >
        Try again
      </button>
    </div>
  );
}
