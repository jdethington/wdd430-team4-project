import Button from '@/components/ui/Button';

export interface Movie {
    id: number;
    title: string;
    year: string;
    category: string;
    rating: string | null;
    summary: string;
}

interface MovieCardProps {
    movie: Movie;
    isAdded: boolean;
    onAdd: (movie: Movie) => void;
}

export default function MovieCard({ movie, isAdded, onAdd }: MovieCardProps) {
    return (
        <article className="group flex flex-col justify-between rounded-sm border border-[#3b3b3b] bg-[#2c2c2c] p-6 shadow-lg transition-all duration-300 hover:border-[#f5c518]/60">
            <div>
                <div className="mb-3 flex items-start justify-between gap-4">
                    <span className="border border-[#f5c518]/20 bg-[#1a1a1a] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#f5c518]">
                        {movie.category}
                    </span>
                    {movie.rating && (
                        <span className="text-xs font-medium text-[#f5c518]">{movie.rating}</span>
                    )}
                </div>

                <h3 className="mb-1 text-2xl font-bold text-[#f5f5f4] transition-colors group-hover:text-[#f5c518]">
                    {movie.title}
                </h3>
                <p className="mb-4 text-xs text-[#afb6c2]">{movie.year}</p>
                <p className="line-clamp-3 text-sm leading-relaxed text-[#afb6c2]">{movie.summary}</p>
            </div>

            <div className="mt-6 border-t border-[#1a1a1a] pt-4">
                <Button
                    type="button"
                    variant={isAdded ? 'secondary' : 'primary'}
                    className="w-full"
                    disabled={isAdded}
                    onClick={() => onAdd(movie)}
                    aria-label={isAdded ? `${movie.title} is in your watchlist` : `Add ${movie.title} to your watchlist`}
                >
                    {isAdded ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>
            </div>
        </article>
    );
}
