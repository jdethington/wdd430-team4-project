"use client";

import { useCallback, useEffect, useState } from "react";
import MovieCard, { Movie, WatchlistStatus } from "./MovieCard";

/** Prefer provider id; fall back to Mongo _id */
function movieKey(movie: { id?: string; _id: string }): string {
  return movie.id && movie.id.length > 0 ? movie.id : movie._id;
}

export default function MovieSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // id → category (or absent if not in list)
  const [watchlistStatus, setWatchlistStatus] = useState<
    Map<string, Exclude<WatchlistStatus, null>>
  >(new Map());

  // which movie id is currently posting
  const [addingId, setAddingId] = useState<string | null>(null);

  // id → error message for that card
  const [addErrors, setAddErrors] = useState<Map<string, string>>(new Map());

  /**
   * Load the user's watchlist once (and when we want a refresh).
   * Builds a Map so each card can show status.
   */
  const loadWatchlistStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) {
        // 401 if not logged in — search page is usually behind auth on dashboard
        return;
      }
      const data = await res.json();

      const next = new Map<string, Exclude<WatchlistStatus, null>>();

      const absorb = (
        movies: { id?: string; _id?: string }[] | undefined,
        category: Exclude<WatchlistStatus, null>,
      ) => {
        if (!Array.isArray(movies)) return;
        for (const m of movies) {
          const key =
            m.id && m.id.length > 0 ? m.id : m._id ? String(m._id) : null;
          if (key) next.set(key, category);
        }
      };

      absorb(data.wantToWatch, "wantToWatch");
      absorb(data.watched, "watched");
      absorb(data.rewatch, "rewatch");

      setWatchlistStatus(next);
    } catch {
      // Non-fatal: cards will just show Add until user tries
    }
  }, []);

  // On first mount, load membership
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWatchlistStatus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWatchlistStatus]);

  const fetchMovies = async (query: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        throw new Error("Unable to fetch movies at this time.");
      }

      const data = await response.json();
      setResults(data.movies || []);
      setHasSearched(true);
      // Refresh status so results match current list
      await loadWatchlistStatus();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setLastQuery(trimmed);
    fetchMovies(trimmed);
  };

  const handleRetry = () => {
    if (lastQuery) fetchMovies(lastQuery);
  };

  /**
   * Optimistic add:
   * 1. Update UI immediately
   * 2. POST
   * 3. On failure, roll back and show error
   */
  const handleAdd = async (movie: Movie) => {
    const id = movieKey(movie);

    // Already showing as in list? Do nothing
    if (watchlistStatus.has(id)) return;

    // Clear previous error for this card
    setAddErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    // --- Optimistic: pretend success ---
    const previousStatus = new Map(watchlistStatus);
    setWatchlistStatus((prev) => {
      const next = new Map(prev);
      next.set(id, "wantToWatch");
      return next;
    });
    setAddingId(id);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: id }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        // Keep optimistic state; optionally trust server category
        setWatchlistStatus((prev) => {
          const next = new Map(prev);
          next.set(id, "wantToWatch");
          return next;
        });
        return;
      }

      if (res.status === 409) {
        // Already in list — keep in UI; use server category if present
        const category =
          data.category === "watched" ||
          data.category === "rewatch" ||
          data.category === "wantToWatch"
            ? data.category
            : "wantToWatch";
        setWatchlistStatus((prev) => {
          const next = new Map(prev);
          next.set(id, category);
          return next;
        });
        return;
      }

      // Real failure — roll back
      setWatchlistStatus(previousStatus);
      setAddErrors((prev) => {
        const next = new Map(prev);
        next.set(
          id,
          typeof data.error === "string"
            ? data.error
            : "Could not add movie. Please try again.",
        );
        return next;
      });
    } catch {
      setWatchlistStatus(previousStatus);
      setAddErrors((prev) => {
        const next = new Map(prev);
        next.set(id, "Network error. Please try again.");
        return next;
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Input & Submit Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search movies by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#1a1a1a] text-[#f5f5f4] placeholder-[#afb6c2]/60 border border-[#f5c518]/30 rounded-md px-4 py-3 focus:outline-none focus:border-[#f5c518] transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !searchTerm.trim()}
          className="bg-[#f5c518] text-[#1a1a1a] font-bold px-6 py-3 rounded-md hover:bg-[#f5c518]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error & Retry State */}
      {errorMessage && (
        <div className="bg-[#e50914]/10 border border-[#e50914]/30 rounded-md p-4 flex items-center justify-between text-[#f5f5f4]">
          <p className="text-sm">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs bg-[#e50914] text-white px-3 py-1.5 rounded font-semibold hover:bg-[#e50914]/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton/State */}
      {loading && (
        <div className="py-8 text-center text-[#afb6c2]">
          Searching database for matches...
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMessage && hasSearched && results.length === 0 && (
        <div className="bg-[#2c2c2c] border border-white/5 rounded-md p-8 text-center">
          <p className="text-[#f5f5f4] font-medium">
            No movies found matching &quot;{lastQuery}&quot;.
          </p>
          <p className="text-sm text-[#afb6c2] mt-1">
            Try checking for typos or searching for a different keyword.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !errorMessage && results.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-[#afb6c2] font-semibold mb-4">
            Search Results ({results.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((movie) => {
              const id = movieKey(movie);
              return (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  status={watchlistStatus.get(id) ?? null}
                  isAdding={addingId === id}
                  addError={addErrors.get(id) ?? null}
                  onAdd={handleAdd}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
