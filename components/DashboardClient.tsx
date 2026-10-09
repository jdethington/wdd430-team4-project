"use client";

import MovieSearch from "@/components/MovieSearch";
import WatchlistDisplay from "@/components/WatchListDisplay";
import { WatchlistProvider } from "@/components/WatchlistContext";

export default function DashboardClient() {
  return (
    <WatchlistProvider>
      <section className="bg-[#2c2c2c]/60 border border-[#f5c518]/20 rounded-lg p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-[#f5f5f4] mb-2">
          Find Movies
        </h2>
        <p className="text-[#afb6c2] text-sm mb-6">
          Search our collection and add titles to your personal watchlist.
        </p>
        <MovieSearch />
      </section>

      <section className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-lg p-8">
        <WatchlistDisplay />
      </section>
    </WatchlistProvider>
  );
}
