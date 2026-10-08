import { redirect } from "next/navigation";
import { auth } from "@/auth";
import MovieSearch from "@/components/MovieSearch";
import WatchlistDisplay from '@/components/WatchListDisplay';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
            Your WatchList
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#f5f5f4]">
            Welcome, {session?.user?.name ?? "Movie Fan"}
          </h1>

          <p className="text-[#afb6c2] mt-3">Your personal movie dashboard.</p>
        </div>

        {/* Movie Search Section */}
        <section className="bg-[#2c2c2c]/60 border border-[#f5c518]/20 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-[#f5f5f4] mb-2">
            Find Movies
          </h2>
          <p className="text-[#afb6c2] text-sm mb-6">
            Search our collection and add titles to your personal watchlist.
          </p>
          <MovieSearch />
        </section>

        {/* Existing Watchlist Card */}
        <section className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[#f5f5f4] mb-3">
            Your Saved WatchList
          </h2>

          <p className="text-[#afb6c2]">
            You are signed in as {session?.user?.email}.
          </p>
          <WatchlistDisplay />
        </section>
      </div>
    </main>
  );
}