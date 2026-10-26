import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { addMovieToWantToWatch } from "@/lib/watchlist";
import {
  hydrateMovieCardFromTmdb,
  formatTmdbId,
  getTmdbMovieDetails,
} from "@/lib/tmdb";

const VALID_CATEGORIES = ["wantToWatch", "watched", "rewatch"] as const;

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
  // Snapshot from search — optional; used to avoid a second API call when possible.
  // Optional UI snapshot — NOT written to movies collection
  movie: z
    .object({
      title: z.string(),
      releaseYear: z.number().nullable().optional(),
      description: z.string().optional(),
      genre: z.string().optional(),
      posterUrl: z.string().nullable().optional(),
    })
    .optional(),
});

/**
 * GET /api/watchlist
 * Requires authentication.
 * Returns the user's watchlist movies organized by category.
 * Optional query: ?category=wantToWatch|watched|rewatch
 *
 * Hydrates each watchlist id from TMDB for card display.
 * Does not read or write the movies collection for card payloads.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (
    category &&
    !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
  ) {
    return NextResponse.json(
      {
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();

    const watchlistDoc = await db.collection("watchlist").findOne({ userId });

    if (!watchlistDoc) {
      return NextResponse.json({
        wantToWatch: [],
        watched: [],
        rewatch: [],
      });
    }

    const wantToWatchIds: string[] = watchlistDoc.wantToWatch || [];
    const watchedIds: string[] = watchlistDoc.watched || [];
    const rewatchIds: string[] = watchlistDoc.rewatch || [];
    const allIds = [
      ...new Set([...wantToWatchIds, ...watchedIds, ...rewatchIds]),
    ];

    const reviews: Record<string, { rating?: number; review?: string }> =
      watchlistDoc.reviews ?? {};

    // TMDB hydrate (no Mongo movies write)
    const cardByRef = new Map<
      string,
      Awaited<ReturnType<typeof hydrateMovieCardFromTmdb>>
    >();

    for (const ref of allIds) {
      const card = await hydrateMovieCardFromTmdb(ref);
      if (card) {
        cardByRef.set(ref, card);
        // Also index by resolved ids so review keys still match
        cardByRef.set(card.id, card);
        if (card.tmdbId) cardByRef.set(card.tmdbId, card);
        if (card.imdbId) cardByRef.set(card.imdbId, card);
      }
    }

    const buildList = (ids: string[]) =>
      ids
        .map((ref) => {
          const card = cardByRef.get(ref);
          if (!card) return null;
          const reviewData =
            reviews[ref] ??
            reviews[card.id] ??
            reviews[card.tmdbId] ??
            reviews[card.imdbId] ??
            {};
          return {
            ...card,
            rating: reviewData.rating,
            review: reviewData.review,
          };
        })
        .filter(Boolean);

    if (category) {
      return NextResponse.json({
        [category]: buildList(watchlistDoc[category] || []),
      });
    }
    return NextResponse.json({
      wantToWatch: buildList(wantToWatchIds),
      watched: buildList(watchedIds),
      rewatch: buildList(rewatchIds),
    });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/watchlist
 * Requires authentication.
 * Adds movieId to wantToWatch only.
 * Does NOT upsert into movies (that happens on detail view).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = AddToWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          errors: { movieId: fieldErrors.movieId?.[0] ?? "" },
        },
        { status: 400 },
      );
    }

    const { movieId } = parsed.data;

    // Prefer stable key: imdb if TMDB knows it, else tmdb id
    let resolvedMovieId = movieId;
    try {
      const details = await getTmdbMovieDetails(movieId);
      if (details) {
        const imdbId = details.imdb_id || details.external_ids?.imdb_id || "";
        const tmdbId = formatTmdbId(details.id);
        resolvedMovieId = imdbId || tmdbId;
      }
    } catch {
      // keep client movieId
    }

    const result = await addMovieToWantToWatch(userId, resolvedMovieId);

    if (!result.created) {
      return NextResponse.json(
        {
          error: "This movie is already in your watchlist.",
          userId,
          movieId: resolvedMovieId,
          category: result.category,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        userId,
        movieId: resolvedMovieId,
        category: "wantToWatch",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { error: "This movie is already in your watchlist." },
        { status: 409 },
      );
    }
    console.error("Add to watchlist error:", error);
    return NextResponse.json(
      { error: "Unable to add movie to watchlist. Please try again." },
      { status: 500 },
    );
  }
}
