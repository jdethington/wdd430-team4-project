'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import type { WatchlistCategory, WatchlistEntryData, WatchlistMovie } from '@/lib/watchlist';

type MovieResult = WatchlistMovie;

interface WatchlistManagerProps {
    initialEntries: WatchlistEntryData[];
    initialLoadError?: boolean;
}

interface EntryDraft {
    category: WatchlistCategory;
    rating: string;
    review: string;
}

const categories: { id: WatchlistCategory; label: string }[] = [
    { id: 'want-to-watch', label: 'Want to Watch' },
    { id: 'watched', label: 'Watched' },
    { id: 'want-to-rewatch', label: 'Want to Rewatch' },
];

function createDraft(entry: WatchlistEntryData): EntryDraft {
    return {
        category: entry.category,
        rating: entry.rating ? String(entry.rating) : '',
        review: entry.review ?? '',
    };
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const data = await response.json() as { error?: string };
        return data.error ?? fallback;
    } catch {
        return fallback;
    }
}

export default function WatchlistManager({ initialEntries, initialLoadError = false }: WatchlistManagerProps) {
    const [entries, setEntries] = useState(initialEntries);
    const [drafts, setDrafts] = useState<Record<string, EntryDraft>>(
        Object.fromEntries(initialEntries.map((entry) => [entry.id, createDraft(entry)])),
    );
    const [activeCategory, setActiveCategory] = useState<WatchlistCategory | 'all'>('want-to-watch');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MovieResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loadFailed, setLoadFailed] = useState(initialLoadError);

    const visibleEntries = activeCategory === 'all'
        ? entries
        : entries.filter((entry) => entry.category === activeCategory);

    async function loadWatchlist() {
        setLoadFailed(false);
        setError('');

        try {
            const response = await fetch('/api/watchlist');
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, 'Unable to load your collection.'));
            }

            const data = await response.json() as { entries: WatchlistEntryData[] };
            setEntries(data.entries);
            setDrafts(Object.fromEntries(data.entries.map((entry) => [entry.id, createDraft(entry)])));
        } catch (loadError) {
            setLoadFailed(true);
            setError(loadError instanceof Error ? loadError.message : 'Unable to load your collection.');
        }
    }

    async function searchMovies(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setResults([]);

        if (!query.trim()) {
            setError('Enter a movie title to search.');
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query.trim())}`);
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, 'Search is unavailable. Try again.'));
            }

            const data = await response.json() as { results: MovieResult[] };
            setResults(data.results);
        } catch (searchError) {
            setError(searchError instanceof Error ? searchError.message : 'Search is unavailable. Try again.');
        } finally {
            setSearching(false);
        }
    }

    async function addMovie(movie: MovieResult) {
        setBusyId(movie.id);
        setError('');

        try {
            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieId: movie.id }),
            });
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, 'Unable to add this movie.'));
            }

            const data = await response.json() as { entry: WatchlistEntryData };
            setEntries((current) => [data.entry, ...current.filter((entry) => entry.movieId !== movie.id)]);
            setDrafts((current) => ({ ...current, [data.entry.id]: createDraft(data.entry) }));
        } catch (addError) {
            setError(addError instanceof Error ? addError.message : 'Unable to add this movie.');
        } finally {
            setBusyId(null);
        }
    }

    function updateDraft(entryId: string, field: keyof EntryDraft, value: string) {
        setDrafts((current) => ({
            ...current,
            [entryId]: { ...current[entryId], [field]: value },
        }));
    }

    async function saveEntry(event: FormEvent<HTMLFormElement>, entry: WatchlistEntryData) {
        event.preventDefault();
        const draft = drafts[entry.id];
        if (!draft) return;

        setBusyId(entry.id);
        setError('');

        try {
            const response = await fetch(`/api/watchlist/${entry.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: draft.category,
                    rating: draft.rating ? Number(draft.rating) : null,
                    review: draft.review || null,
                }),
            });
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, 'Unable to save this movie.'));
            }

            const data = await response.json() as { entry: WatchlistEntryData };
            setEntries((current) => current.map((item) => item.id === entry.id ? data.entry : item));
            setDrafts((current) => ({ ...current, [entry.id]: createDraft(data.entry) }));
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Unable to save this movie.');
        } finally {
            setBusyId(null);
        }
    }

    async function removeEntry(entry: WatchlistEntryData) {
        if (!window.confirm(`Remove ${entry.movie.title} from your collection?`)) return;

        setBusyId(entry.id);
        setError('');
        try {
            const response = await fetch(`/api/watchlist/${entry.id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, 'Unable to remove this movie.'));
            }

            setEntries((current) => current.filter((item) => item.id !== entry.id));
            setDrafts((current) => {
                const nextDrafts = { ...current };
                delete nextDrafts[entry.id];
                return nextDrafts;
            });
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : 'Unable to remove this movie.');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-14">
            <section aria-labelledby="search-heading" className="border-b border-[#3b3b3b] pb-12">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c518]">Movie catalog</p>
                        <h2 id="search-heading" className="text-2xl font-semibold text-[#f5f5f4]">Find a film to add</h2>
                    </div>
                    <p className="text-sm text-[#afb6c2]">{entries.length} {entries.length === 1 ? 'title' : 'titles'} in your collection</p>
                </div>

                <form onSubmit={searchMovies} className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="movie-search">Search movies</label>
                    <input
                        id="movie-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by movie title or keyword"
                        className="min-w-0 flex-1 border border-[#555] bg-[#202020] px-4 py-3 text-[#f5f5f4] placeholder:text-[#afb6c2] focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                    />
                    <button type="submit" disabled={searching} className="border border-[#f5c518] bg-[#f5c518] px-6 py-3 text-sm font-semibold uppercase text-[#1a1a1a] transition-colors hover:bg-[#d4a713] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]">
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {results.length > 0 && (
                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                        {results.map((movie) => {
                            const added = entries.some((entry) => entry.movieId === movie.id);
                            return (
                                <article key={movie.id} className="flex gap-4 border border-[#3b3b3b] bg-[#242424] p-4">
                                    {movie.posterUrl ? (
                                        <Image src={movie.posterUrl} alt={`${movie.title} poster`} width={72} height={108} unoptimized className="h-[108px] w-[72px] shrink-0 object-cover" />
                                    ) : (
                                        <div aria-hidden="true" className="h-[108px] w-[72px] shrink-0 bg-[#343434]" />
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col items-start">
                                        <h3 className="font-semibold text-[#f5f5f4]">{movie.title}</h3>
                                        <p className="mt-1 text-xs text-[#afb6c2]">{movie.year || 'Year unknown'}</p>
                                        <p className="mt-2 line-clamp-2 text-sm text-[#afb6c2]">{movie.summary}</p>
                                        <button
                                            type="button"
                                            onClick={() => addMovie(movie)}
                                            disabled={added || busyId === movie.id}
                                            className="mt-auto pt-3 text-xs font-semibold uppercase text-[#f5c518] hover:text-[#ffe16b] disabled:cursor-not-allowed disabled:text-[#afb6c2] focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                                            aria-label={added ? `${movie.title} is in your collection` : `Add ${movie.title} to your collection`}
                                        >
                                            {added ? 'Added' : busyId === movie.id ? 'Adding...' : '+ Add to collection'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
                {!searching && query.trim() && results.length === 0 && !error && (
                    <p className="mt-5 text-sm text-[#afb6c2]">No matching movies. Try another title or keyword.</p>
                )}
            </section>

            <section aria-labelledby="collection-heading">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c518]">Your collection</p>
                        <h2 id="collection-heading" className="text-2xl font-semibold text-[#f5f5f4]">Saved movies</h2>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter collection by category">
                        <button type="button" onClick={() => setActiveCategory('all')} aria-pressed={activeCategory === 'all'} className={`border px-3 py-2 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5c518] ${activeCategory === 'all' ? 'border-[#f5c518] text-[#f5c518]' : 'border-[#555] text-[#afb6c2] hover:border-[#f5c518]'}`}>All</button>
                        {categories.map((category) => (
                            <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} aria-pressed={activeCategory === category.id} className={`border px-3 py-2 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5c518] ${activeCategory === category.id ? 'border-[#f5c518] text-[#f5c518]' : 'border-[#555] text-[#afb6c2] hover:border-[#f5c518]'}`}>
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p role="alert" className="mb-5 border-l-2 border-red-400 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>}
                {loadFailed ? (
                    <div className="border border-[#3b3b3b] px-6 py-8 text-center">
                        <p className="text-[#f5f5f4]">Your collection could not be loaded.</p>
                        <button type="button" onClick={loadWatchlist} className="mt-3 text-sm font-semibold text-[#f5c518] underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#f5c518]">Try again</button>
                    </div>
                ) : visibleEntries.length === 0 ? (
                    <div className="border border-dashed border-[#555] px-6 py-10 text-center">
                        <p className="font-medium text-[#f5f5f4]">{entries.length === 0 ? 'Your collection is ready for its first movie.' : 'No movies in this category yet.'}</p>
                        <p className="mt-2 text-sm text-[#afb6c2]">Search the catalog above and add a title to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {visibleEntries.map((entry) => {
                            const draft = drafts[entry.id] ?? createDraft(entry);
                            return (
                                <article key={entry.id} className="border border-[#3b3b3b] bg-[#242424] p-5">
                                    <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#3b3b3b] pb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#f5f5f4]">{entry.movie.title}</h3>
                                            <p className="mt-1 text-xs text-[#afb6c2]">{entry.movie.year || 'Year unknown'}</p>
                                        </div>
                                        <button type="button" onClick={() => removeEntry(entry)} disabled={busyId === entry.id} aria-label={`Remove ${entry.movie.title}`} className="text-xs text-[#afb6c2] underline underline-offset-4 hover:text-red-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#f5c518]">Remove</button>
                                    </div>
                                    <form onSubmit={(event) => saveEntry(event, entry)} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="text-xs font-medium text-[#afb6c2]">
                                                Category
                                                <select value={draft.category} onChange={(event) => updateDraft(entry.id, 'category', event.target.value)} className="mt-2 block w-full border border-[#555] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f4] focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                                                </select>
                                            </label>
                                            <label className="text-xs font-medium text-[#afb6c2]">
                                                Personal rating (1-5)
                                                <input type="number" min="1" max="5" step="1" value={draft.rating} onChange={(event) => updateDraft(entry.id, 'rating', event.target.value)} placeholder="Not rated" className="mt-2 block w-full border border-[#555] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f4] placeholder:text-[#777] focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
                                            </label>
                                        </div>
                                        <label className="block text-xs font-medium text-[#afb6c2]">
                                            Review
                                            <textarea maxLength={2000} rows={3} value={draft.review} onChange={(event) => updateDraft(entry.id, 'review', event.target.value)} placeholder="Add a private note about this movie" className="mt-2 block w-full resize-y border border-[#555] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f4] placeholder:text-[#777] focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
                                        </label>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-[#777]">{draft.review.length}/2000</span>
                                            <button type="submit" disabled={busyId === entry.id} className="border border-[#f5c518] px-4 py-2 text-xs font-semibold uppercase text-[#f5c518] transition-colors hover:bg-[#f5c518] hover:text-[#1a1a1a] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                                                {busyId === entry.id ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </div>
                                    </form>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}