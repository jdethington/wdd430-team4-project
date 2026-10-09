export interface Movie {
  _id: string;
  title: string;
  releaseYear?: number | null;
  description: string;
  genre?: string;
  posterUrl?: string | null;
}

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-md p-5 flex flex-col justify-between hover:border-[#f5c518]/50 transition-colors shadow-md">
      <div>
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="w-full h-48 object-cover rounded-md mb-3"
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
      </div>
    </div>
  );
}