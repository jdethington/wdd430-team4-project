import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError, ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { addMovieToWantToWatch } from "@/lib/watchlist";

const VALID_CATEGORIES = ["wantToWatch", "watched", "rewatch"] as const;

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
});

/**
 * GET /api/watchlist
 * Requires authentication.
 * Returns the user's watchlist movies organized by category.
 * Optional query: ?category=wantToWatch|watched|rewatch
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

    const movies =
      allIds.length > 0
        ? await db
            .collection("movies")
            .find({ id: { $in: allIds } })
            .toArray()
        : [];

    type MovieDocument = {
      _id: { toString: () => string };
      title?: string;
      releaseYear?: number | null;
      overview?: string;
      description?: string;
      genres?: { name?: string }[];
      genre?: string;
      imageSet?: {
        verticalPoster?: { w240?: string | null };
      };
    };

    const movieMap = new Map<string, MovieDocument>(
      movies.map((movie) => [
        String(movie.id),
        movie as unknown as MovieDocument,
      ]),
    );

    const sanitizeMovie = (movie: MovieDocument) => ({
      _id: movie._id.toString(),
      title: movie.title ?? "Untitled",
      releaseYear: movie.releaseYear ?? null,
      description:
        movie.overview ?? movie.description ?? "No description available.",
      genre: Array.isArray(movie.genres)
        ? movie.genres
            .map((g: { name?: string }) => g.name)
            .filter(Boolean)
            .join(", ")
        : (movie.genre ?? ""),
      posterUrl: movie.imageSet?.verticalPoster?.w240 ?? null,
    });

    const getMovies = (ids: string[]) =>
      ids
        .map((id) => movieMap.get(id))
        .filter((movie): movie is MovieDocument => movie !== undefined)
        .map(sanitizeMovie);

    if (category) {
      return NextResponse.json({
        [category]: getMovies(watchlistDoc[category] || []),
      });
    }

    return NextResponse.json({
      wantToWatch: getMovies(wantToWatchIds),
      watched: getMovies(watchedIds),
      rewatch: getMovies(rewatchIds),
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
 * Adds movieId to the user's wantToWatch array.
 * Prevents duplicates across wantToWatch / watched / rewatch.
 * Returns the membership result.
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
          errors: {
            movieId: fieldErrors.movieId?.[0] ?? "",
          },
        },
        { status: 400 },
      );
    }

    const { movieId } = parsed.data;

    const db = await getDb();
    const movieQuery: Record<string, unknown>[] = [{ id: movieId }];

    if (ObjectId.isValid(movieId)) {
      movieQuery.push({ _id: new ObjectId(movieId) });
    }

    const movie = await db.collection("movies").findOne({ $or: movieQuery });

    if (!movie) {
      return NextResponse.json(
        { error: "Movie not found." },
        { status: 404 },
      );
    }

    const resolvedMovieId =
      typeof movie.id === "string" && movie.id.length > 0
        ? movie.id
        : movie._id.toString();

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
