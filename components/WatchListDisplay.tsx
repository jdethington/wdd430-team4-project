"use client";

import MovieCard from "@/components/MovieCard";
import { useWatchlist } from "@/components/WatchlistContext";

export default function WatchlistDisplay() {
  const { watchlist, loading, error, refresh } = useWatchlist();

  if (loading) {
    return (
      <p className="text-[#afb6c2] text-center py-12">
        Loading your watchlist...
      </p>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-md p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalMovies =
    watchlist.wantToWatch.length +
    watchlist.watched.length +
    watchlist.rewatch.length;

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-4 mb-3">
          <div className="h-[1px] w-12 bg-[#f5c518]" />
          <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
            Your Collection
          </span>
          <div className="h-[1px] w-12 bg-[#f5c518]" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#f5f5f4]">
          My <span className="text-[#f5c518]">WatchList</span>
        </h2>
        {totalMovies > 0 && (
          <p className="text-[#afb6c2] mt-2">
            {totalMovies} {totalMovies === 1 ? "movie" : "movies"} in your
            collection
          </p>
        )}
      </div>

      {totalMovies === 0 && (
        <div className="bg-[#1a1a1a] border border-[#f5c518]/20 rounded-sm p-12 text-center">
          <p className="text-[#f5f5f4] text-lg font-semibold mb-2">
            Your watchlist is empty!
          </p>
          <p className="text-[#afb6c2] text-sm">
            Search for a movie above to get started.
          </p>
        </div>
      )}

      {watchlist.wantToWatch.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-[#f5f5f4]">Want to Watch</h3>
            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
              {watchlist.wantToWatch.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlist.wantToWatch.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {watchlist.watched.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-[#f5f5f4]">Watched</h3>
            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
              {watchlist.watched.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlist.watched.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {watchlist.rewatch.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-[#f5f5f4]">
              Want to Rewatch
            </h3>
            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
              {watchlist.rewatch.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlist.rewatch.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
