'use client';

import { useEffect, useState } from 'react';
import MovieCard, { Movie } from '@/components/MovieCard';

interface WatchlistData {
    wantToWatch: Movie[];
    watched: Movie[];
    rewatch: Movie[];
}

export default function Dashboard() {
    const [watchlist, setWatchlist] = useState<WatchlistData>({
        wantToWatch: [],
        watched: [],
        rewatch: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/watchlist')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load watchlist');
                return res.json();
            })
            .then(data => {
                setWatchlist(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Unable to load your watchlist. Please try again.');
                setLoading(false);
            });
    }, []); 

    if (loading) {
        return (
            <div className="min-h-[80vh] px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#afb6c2] text-center py-20">
                        Loading your watchlist...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-md p-6 text-center">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalMovies = watchlist.wantToWatch.length + watchlist.watched.length + watchlist.rewatch.length;

    return (
        <div className="min-h-[80vh] px-4 py-12">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-[1px] w-12 bg-[#f5c518]" />
                        <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
                            Your Collection
                        </span>
                        <div className="h-[1px] w-12 bg-[#f5c518]" />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-[#f5f5f4]">
                        My <span className="text-[#f5c518]">WatchList</span>
                    </h1>
                    {totalMovies > 0 && (
                        <p className="text-[#afb6c2] mt-2">
                            {totalMovies} {totalMovies === 1 ? 'movie' : 'movies'} in your collection
                        </p>
                    )}
                </div>

                {/* Empty state */}
                {totalMovies === 0 && (
                    <div className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-sm p-12 text-center">
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
                            <h2 className="text-xl font-bold text-[#f5f5f4]">
                                Want to Watch
                            </h2>
                            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
                                {watchlist.wantToWatch.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {watchlist.wantToWatch.map(movie => (
                                <MovieCard key={movie._id} movie={movie} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Watched */}
                {watchlist.watched.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-[#f5f5f4]">
                                Watched
                            </h2>
                            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
                                {watchlist.watched.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {watchlist.watched.map(movie => (
                                <MovieCard key={movie._id} movie={movie} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Want to Rewatch */}
                {watchlist.rewatch.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-[#f5f5f4]">
                                Want to Rewatch
                            </h2>
                            <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
                                {watchlist.rewatch.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {watchlist.rewatch.map(movie => (
                                <MovieCard key={movie._id} movie={movie} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}