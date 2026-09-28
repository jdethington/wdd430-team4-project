'use client';

import { useState } from 'react';
import MovieCard, { type Movie } from '@/components/MovieCard';

interface MovieListProps {
    movies: Movie[];
}

export default function MovieList({ movies }: MovieListProps) {
    const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

    function addToWatchlist(movie: Movie) {
        setWatchlistIds((currentIds) =>
            currentIds.includes(movie.id) ? currentIds : [...currentIds, movie.id],
        );
    }

    return (
        <div>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h2 className="mb-3 text-3xl font-bold text-[#f5f5f4]">Build Your Watchlist</h2>
                    <p className="max-w-xl text-sm text-[#afb6c2]">
                        Save a film now and keep it ready for your next movie night.
                    </p>
                </div>
                <p className="border-l-2 border-[#f5c518] pl-3 text-sm text-[#afb6c2]" aria-live="polite">
                    <span className="font-semibold text-[#f5c518]">{watchlistIds.length}</span>{' '}
                    {watchlistIds.length === 1 ? 'film' : 'films'} saved
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {movies.map((movie) => (
                    <MovieCard
                        key={movie.id}
                        movie={movie}
                        isAdded={watchlistIds.includes(movie.id)}
                        onAdd={addToWatchlist}
                    />
                ))}
            </div>
        </div>
    );
}
