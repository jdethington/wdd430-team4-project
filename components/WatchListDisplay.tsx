"use client";

import { useState } from "react";
import MovieCard, {
  type Movie,
  type WatchlistStatus,
} from "@/components/MovieCard";
import ReviewModal from "@/components/ReviewModal";
import {
  useWatchlist,
  type WatchlistCategory,
} from "@/components/WatchlistContext";
import ConfirmModal from "@/components/ConfirmModal";
import CardSkeleton from "@/components/ui/CardSkeleton";

export default function WatchlistDisplay() {
  const {
    watchlist,
    loading,
    error,
    refresh,
    updateMovieCategoryOptimistic,
    updateMovieReviewOptimistic,
  } = useWatchlist();

  // State to control Review Modal
  const [activeReviewMovie, setActiveReviewMovie] = useState<Movie | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Helper to resolve MongoDB _id or id
  const getMovieId = (movie: Movie) => movie.id || movie._id || "";

  // Handle status/category change
  const handleStatusChange = async (
    movie: Movie,
    newStatus: Exclude<WatchlistStatus, null>,
  ) => {
    const movieId = getMovieId(movie);
    if (!movieId) return;

    // 1. Instantly move across sections in the UI
    updateMovieCategoryOptimistic(movieId, newStatus as WatchlistCategory);

    // 2. Persist to API
    setUpdatingId(movieId);
    try {
      const res = await fetch(`/api/watchlist/${movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // If PATCH fails, refresh to revert back to server truth
        await refresh();
      } else if (newStatus === "watched") {
        // Optional UX polish: prompt review when moving to Watched
        setActiveReviewMovie({ ...movie, status: newStatus });
      }
    } catch {
      await refresh();
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle review save from modal
  const handleSaveReview = async (data: { rating: number; review: string }) => {
    if (!activeReviewMovie) return;
    const movieId = getMovieId(activeReviewMovie);
    if (!movieId) return;

    // 1. Optimistically update local review & rating
    updateMovieReviewOptimistic(movieId, data);

    // 2. Persist to API
    try {
      const res = await fetch(`/api/watchlist/${movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        await refresh();
      }
    } catch {
      await refresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!movieToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    const movieId = movieToDelete.id || movieToDelete._id;
    if (!movieId) {
      setDeleteError("Unable to identify movie. Please try again.");
      setIsDeleting(false);
      return;
    }
    try {
      const response = await fetch(`/api/watchlist/${movieId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setMovieToDelete(null);
      await refresh();
    } catch {
      setDeleteError("Failed to remove movie. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-[#2c2c2c] rounded w-48 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
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
    <>
      <ConfirmModal
        isOpen={!!movieToDelete}
        title="Remove Movie"
        message={`Remove "${movieToDelete?.title}" from your watchlist?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMovieToDelete(null)}
        isLoading={isDeleting}
      />
      {deleteError && (
        <p className="text-red-400 text-sm mb-4">{deleteError}</p>
      )}
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

        {/* Want to Watch */}
        {watchlist.wantToWatch.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-bold text-[#f5f5f4]">
                Want to Watch
              </h3>
              <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
                {watchlist.wantToWatch.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchlist.wantToWatch.map((movie) => (
                <MovieCard
                  key={getMovieId(movie)}
                  movie={movie}
                  status="wantToWatch"
                  isUpdatingStatus={updatingId === getMovieId(movie)}
                  onStatusChange={handleStatusChange}
                  onOpenReview={(m) => setActiveReviewMovie(m)}
                  onDelete={setMovieToDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Watched */}
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
                <MovieCard
                  key={getMovieId(movie)}
                  movie={movie}
                  status="watched"
                  isUpdatingStatus={updatingId === getMovieId(movie)}
                  onStatusChange={handleStatusChange}
                  onOpenReview={(m) => setActiveReviewMovie(m)}
                  onDelete={setMovieToDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Want to Rewatch */}
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
                <MovieCard
                  key={getMovieId(movie)}
                  movie={movie}
                  status="rewatch"
                  isUpdatingStatus={updatingId === getMovieId(movie)}
                  onStatusChange={handleStatusChange}
                  onOpenReview={(m) => setActiveReviewMovie(m)}
                  onDelete={setMovieToDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Review & Rating Modal */}
        <ReviewModal
          isOpen={Boolean(activeReviewMovie)}
          movieTitle={activeReviewMovie?.title ?? ""}
          initialRating={activeReviewMovie?.rating ?? 5}
          initialReview={activeReviewMovie?.review ?? ""}
          onClose={() => setActiveReviewMovie(null)}
          onSubmit={handleSaveReview}
        />
      </div>
    </>
  );
}
