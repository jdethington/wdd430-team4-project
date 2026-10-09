import Image from "next/image";

export interface Movie {
  id?: string;
  _id: string;
  title: string;
  releaseYear?: number | null;
  description: string;
  genre?: string;
  posterUrl?: string | null;
}

export type WatchlistStatus = "wantToWatch" | "watched" | "rewatch" | null;

interface MovieCardProps {
  movie: Movie;
  status?: WatchlistStatus; // null = not in the user's list yet
  isAdding?: boolean; // true while a POST is in flight for this card
  addError?: string | null; // error message for this card, if any
  onAdd?: (movie: Movie) => void; // called when user clicks Add
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
}: MovieCardProps) {
  const alreadyInList = status !== null;

  return (
    <div className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-md p-5 flex flex-col justify-between hover:border-[#f5c518]/50 transition-colors shadow-md">
      <div>
        {/* *** Full Poster *** */}
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
        )}{" "}
        {/* --- Cut Poster --- */}
        {/* {movie.posterUrl && (
          <div className="relative mb-3 h-48 w-full overflow-hidden rounded-md">
            <Image
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )} */}
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
      </div>

      {/* Add / status controls */}
      {onAdd !== undefined && (
        <div className="mt-4 space-y-2">
          {alreadyInList ? (
            <button
              type="button"
              disabled
              className="w-full rounded-md border border-[#f5c518]/30 bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-[#f5c518] opacity-80 cursor-default"
              aria-label={`${movie.title} is in your list: ${statusLabel(status)}`}
            >
              {statusLabel(status)}
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
    </div>
  );
}
