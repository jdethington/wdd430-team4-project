import Link from "next/link";

export default function MovieNotFound() {
  return (
    <main className="min-h-[70vh] px-4 py-16 flex items-center">
      <section className="max-w-2xl mx-auto w-full bg-[#2c2c2c] border border-[#f5c518]/20 rounded-sm p-8 text-center">
        <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-3">
          Movie Not Found
        </p>
        <h1 className="font-serif text-3xl text-[#f5f5f4] font-bold mb-3">
          We couldn&apos;t find that title
        </h1>
        <p className="text-[#afb6c2] mb-6">
          The movie may have been removed or the id is invalid.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-sm bg-[#f5c518] px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#f5c518]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
        >
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
