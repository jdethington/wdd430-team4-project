"use client";

import Image from "next/image";

export type WatchlistStatus = "wantToWatch" | "watched" | "rewatch" | null;

export interface Movie {
  id?: string;
  _id: string;
  title: string;
  releaseYear?: number | null;
  description: string;
  genre?: string;
  posterUrl?: string | null;
  status?: WatchlistStatus;
  rating?: number;
  review?: string;
}

interface MovieCardProps {
  movie: Movie;
  status?: WatchlistStatus; // null = not in the user's list yet
  isAdding?: boolean; // true while a POST is in flight
  addError?: string | null;
  onAdd?: (movie: Movie) => void;
  /** Issue #28: Status change handler for watchlist cards */
  onStatusChange?: (
    movie: Movie,
    newStatus: Exclude<WatchlistStatus, null>,
  ) => void;
  /** Issue #28: Trigger to open the review modal */
  onOpenReview?: (movie: Movie) => void;
  isUpdatingStatus?: boolean;
  onDelete?: (movie: Movie) => void;
}

function statusLabel(status: WatchlistStatus): string {
  if (status === "wantToWatch") return "Want to Watch";
  if (status === "watched") return "Watched";
  if (status === "rewatch") return "Want to Rewatch";
  return "";
}

export default function MovieCard({
  movie,
  status = null,
  isAdding = false,
  addError = null,
  onAdd,
  onStatusChange,
  onOpenReview,
  isUpdatingStatus = false,
  onDelete,
}: MovieCardProps) {
  const currentStatus = status ?? movie.status ?? null;
  const alreadyInList = currentStatus !== null;

  return (
    <div className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-md p-5 flex flex-col justify-between hover:border-[#f5c518]/50 transition-colors shadow-md">
      <div>
        {movie.posterUrl && (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            width={500}
            height={192}
            loading="eager"
            className="w-full h-48 object-cover rounded-md mb-3"
            style={{ width: "100%", height: "auto" }}
          />
        )}

        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-serif text-lg font-bold text-[#f5f5f4] leading-tight">
            {movie.title}
          </h3>
          {movie.releaseYear && (
            <span className="text-xs bg-[#1a1a1a] text-[#f5c518] px-2 py-1 rounded font-semibold border border-[#f5c518]/20">
              {movie.releaseYear}
            </span>
          )}
        </div>

        {movie.genre && (
          <p className="text-xs text-[#afb6c2] mb-3 uppercase tracking-wider font-semibold">
            {movie.genre}
          </p>
        )}

        <p className="text-[#afb6c2] text-sm line-clamp-3">
          {movie.description}
        </p>

        {/* Existing rating & review snippet if present */}
        {(movie.rating || movie.review) && (
          <div className="mt-3 pt-3 border-t border-[#f5c518]/10 text-xs text-[#afb6c2]">
            {movie.rating && (
              <span className="text-[#f5c518] font-bold block mb-1">
                {"★".repeat(movie.rating)}
                {"☆".repeat(5 - movie.rating)} ({movie.rating}/5)
              </span>
            )}
            {movie.review && (
              <p className="italic text-[#f5f5f4]/80 line-clamp-2">
                &ldquo;{movie.review}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Watchlist Controls (When card is rendered on the Watchlist page) */}
      {onStatusChange && currentStatus && (
        <div className="mt-4 pt-3 border-t border-[#f5c518]/10 flex items-center justify-between gap-2">
          <div className="flex-1">
            <label
              htmlFor={`status-${movie.id || movie._id}`}
              className="sr-only"
            >
              Change Status
            </label>
            <select
              id={`status-${movie.id || movie._id}`}
              value={currentStatus}
              disabled={isUpdatingStatus}
              onChange={(e) =>
                onStatusChange(
                  movie,
                  e.target.value as Exclude<WatchlistStatus, null>,
                )
              }
              className="w-full bg-[#1a1a1a] border border-[#f5c518]/30 rounded px-2.5 py-1.5 text-xs font-semibold text-[#f5c518] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f5c518] disabled:opacity-50"
            >
              <option value="wantToWatch">Want to Watch</option>
              <option value="watched">Watched</option>
              <option value="rewatch">Want to Rewatch</option>
            </select>
          </div>

          {onOpenReview && (
            <button
              type="button"
              onClick={() => onOpenReview(movie)}
              className="px-2.5 py-1.5 bg-[#1a1a1a] border border-[#f5c518]/40 hover:bg-[#f5c518]/20 text-[#f5c518] rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              {movie.rating ? "Edit Review" : "Review"}
            </button>
          )}
        </div>
      )}

      {/* Add / status controls (When card is rendered on the Search page) */}
      {onAdd !== undefined && (
        <div className="mt-4 space-y-2">
          {alreadyInList ? (
            <button
              type="button"
              disabled
              className="w-full rounded-md border border-[#f5c518]/30 bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-[#f5c518] opacity-80 cursor-default"
              aria-label={`${movie.title} is in your list: ${statusLabel(currentStatus)}`}
            >
              {statusLabel(currentStatus)}
            </button>
          ) : (
            <button
              type="button"
              disabled={isAdding}
              onClick={() => onAdd(movie)}
              className="w-full rounded-md bg-[#f5c518] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#f5c518]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
              aria-label={`Add ${movie.title} to watchlist`}
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          )}

          {addError && (
            <p className="text-xs text-[#e50914]" role="alert">
              {addError}
            </p>
          )}
        </div>
      )}
      {/* Delete button — only shown on watchlist cards */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(movie)}
          aria-label={`Remove ${movie.title} from watchlist`}
          className="mt-4 w-full py-2 border border-red-500/30 text-red-400 text-xs font-semibold rounded-sm hover:bg-red-500/10 hover:border-red-500/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
        >
          Remove from Watchlist
        </button>
      )}
    </div>
  );
}
