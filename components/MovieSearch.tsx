"use client";

import { useState } from "react";
import MovieCard, { Movie } from "./MovieCard";

export default function MovieSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchMovies = async (query: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("Unable to fetch movies at this time.");
      }

      const data = await response.json();
      setResults(data.movies || []);
      setHasSearched(true);
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

    // Acceptance criterion: Reject blank searches client-side before calling API
    if (!trimmed) {
      return;
    }

    setLastQuery(trimmed);
    fetchMovies(trimmed);
  };

  const handleRetry = () => {
    if (lastQuery) {
      fetchMovies(lastQuery);
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
          <p className="text-[#f5f5f4] font-medium">No movies found matching &quot;{lastQuery}&quot;.</p>
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
            {results.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}