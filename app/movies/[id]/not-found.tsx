import Link from "next/link";

export default function MovieNotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-3xl font-bold text-[#f5f5f4] mb-3">
        Movie not found
      </h1>
      <p className="text-[#afb6c2] mb-6 max-w-md">
        We couldn&apos;t find that title in the catalog.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#f5c518]/90"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
