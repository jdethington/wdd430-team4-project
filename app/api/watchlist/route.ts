// /app/api/watchlist/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';

const VALID_CATEGORIES = ['wantToWatch', 'watched', 'rewatch'] as const;

export async function GET(request: Request) {
    // check authentication
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // validate category if provided
    if (category && !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
        return NextResponse.json(
            { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
            { status: 400 }
        );
    }
    try {
        const db = await getDb();

        // find the user's watchlist document
        const watchlistDoc = await db
            .collection('watchlist')
            .findOne({ userId });

        // if no watchlist exists yet, return empty structure
        if (!watchlistDoc) {
            return NextResponse.json({
                wantToWatch: [],
                watched: [],
                rewatch: [],
            });
        }
        // get the movie IDs we need to look up
        const wantToWatchIds: string[] = watchlistDoc.wantToWatch || [];
        const watchedIds: string[] = watchlistDoc.watched || [];
        const rewatchIds: string[] = watchlistDoc.rewatch || [];

        // collect all unique IDs to fetch in one query (instead of three separate queries)
        const allIds = [...new Set([...wantToWatchIds, ...watchedIds, ...rewatchIds])];

        // fetch movie details for all IDs at once
        const movies = allIds.length > 0
            ? await db.collection('movies')
                .find({ id: { $in: allIds } })
                .toArray()
            : [];

        // build a lookup map for quick access
        const movieMap = new Map(movies.map(m => [m.id, m]));

        // helper to transform raw movie document to match MovieCard interface
        const sanitizeMovie = (movie: any) => ({
            _id: movie._id.toString(),
            title: movie.title ?? "Untitled",
            releaseYear: movie.releaseYear ?? null,
            description: movie.overview ?? movie.description ?? "No description available.",
            genre: Array.isArray(movie.genres)
                ? movie.genres.map((g: { name?: string }) => g.name).filter(Boolean).join(", ")
                : movie.genre ?? "",
            posterUrl: movie.imageSet?.verticalPoster?.w240 ?? null,
        });

        // helper to get movie details by id
        const getMovies = (ids: string[]) =>
            ids
                .map(id => movieMap.get(id))
                .filter(Boolean) // remove any undefined entries in case a movie ID in the watchlist doesn't exist in the movies collection
                .map(sanitizeMovie);

        // if category filter requested, return only that category
        if (category) {
            return NextResponse.json({
                [category]: getMovies(watchlistDoc[category] || []),
            });
        }

        // return all categories
        return NextResponse.json({
            wantToWatch: getMovies(wantToWatchIds),
            watched: getMovies(watchedIds),
            rewatch: getMovies(rewatchIds),
        });

    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to fetch watchlist' },
            { status: 500 }
        );
    }
}

