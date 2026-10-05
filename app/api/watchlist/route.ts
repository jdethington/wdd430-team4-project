import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { movies } from "@/lib/watchlist-db";
import {
    createWatchlistEntry,
    getUserWatchlist,
    parseUserId,
    toWatchlistEntryData,
    WATCHLIST_CATEGORIES,
} from "@/lib/watchlist";

const CreateEntrySchema = z.object({
    movieId: z.string().trim().min(1).max(100),
    category: z.enum(WATCHLIST_CATEGORIES).default("want-to-watch"),
});

export async function GET(request: Request) {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);

    if (!userId) {
        return NextResponse.json({ error: "Please sign in to view your watchlist." }, { status: 401 });
    }

    const categoryParam = new URL(request.url).searchParams.get("category");
    const category = categoryParam || undefined;

    if (category && !WATCHLIST_CATEGORIES.includes(category as (typeof WATCHLIST_CATEGORIES)[number])) {
        return NextResponse.json({ error: "Invalid watchlist category." }, { status: 400 });
    }

    try {
        const entries = await getUserWatchlist(userId, category as (typeof WATCHLIST_CATEGORIES)[number] | undefined);

        return NextResponse.json({ entries: entries.map(toWatchlistEntryData) });
    } catch (error) {
        console.error("Watchlist read error:", error);
        return NextResponse.json({ error: "Unable to load your watchlist." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);

    if (!userId) {
        return NextResponse.json({ error: "Please sign in to add movies." }, { status: 401 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = CreateEntrySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Movie details are invalid.", issues: parsed.error.flatten().fieldErrors },
            { status: 400 },
        );
    }

    const catalogMovie = movies.find((movie) => movie.id === parsed.data.movieId);

    if (!catalogMovie) {
        return NextResponse.json({ error: "Movie not found in the catalog." }, { status: 404 });
    }

    const movie = {
        id: catalogMovie.id,
        title: catalogMovie.title,
        year: String(catalogMovie.releaseYear),
        summary: catalogMovie.overview,
        posterUrl: catalogMovie.imageSet?.verticalPoster?.w360,
    };

    try {
        const entry = await createWatchlistEntry(
            userId,
            movie,
            parsed.data.category,
        );

        return NextResponse.json({ entry: toWatchlistEntryData(entry) }, { status: 201 });
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            return NextResponse.json({ error: "This movie is already in your watchlist." }, { status: 409 });
        }

        console.error("Watchlist create error:", error);
        return NextResponse.json({ error: "Unable to add this movie." }, { status: 500 });
    }
}