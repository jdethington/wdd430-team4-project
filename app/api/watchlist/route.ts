import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { addMovieToWantToWatch } from "@/lib/watchlist";
import { ensureMovieInDb, upsertMovie } from "@/lib/movies";

const VALID_CATEGORIES = ["wantToWatch", "watched", "rewatch"] as const;

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
  // Snapshot from search - used to upsert without a second API call. Optional because we can fetch from Streaming Availability if missing.
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
      id?: string;
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

    // Pull reviews from the watchlist document
    const reviews: Record<string, { rating?: number; review?: string }> =
      watchlistDoc.reviews ?? {};

    const sanitizeMovie = (movie: MovieDocument) => {
      const id = String((movie as { id?: string }).id ?? movie._id.toString());
      const reviewData = reviews[id] ?? {};

      return {
        _id: movie._id.toString(),
        id, // provider id used in wantToWatch / watched / rewatch arrays
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
        // Include rating & review so they survive page reloads
        rating: reviewData.rating,
        review: reviewData.review,
      };
    };

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
 * If the movie is not in the local catalog yet, fetches it from
 * Streaming Availability API and upserts it first.
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

    const { movieId, movie: moviePayload } = parsed.data;

    if (moviePayload) {
      await upsertMovie({
        id: movieId,
        title: moviePayload.title,
        releaseYear: moviePayload.releaseYear ?? undefined,
        overview: moviePayload.description ?? "",
        genres: moviePayload.genre
          ? moviePayload.genre.split(", ").map((name) => ({ id: name, name }))
          : [],
        imageSet: {
          verticalPoster: {
            w240: moviePayload.posterUrl ?? "",
            w360: moviePayload.posterUrl ?? "",
            w480: moviePayload.posterUrl ?? "",
            w600: moviePayload.posterUrl ?? "",
            w720: moviePayload.posterUrl ?? "",
          },
          horizontalPoster: {
            w360: moviePayload.posterUrl ?? "",
            w480: moviePayload.posterUrl ?? "",
            w720: moviePayload.posterUrl ?? "",
            w1080: moviePayload.posterUrl ?? "",
            w1440: moviePayload.posterUrl ?? "",
          },
        },
      } as Parameters<typeof upsertMovie>[0]);
    } else {
      const movie = await ensureMovieInDb(movieId);

      if (!movie) {
        return NextResponse.json(
          { error: "Movie not found." },
          { status: 404 },
        );
      }
    }

    const resolvedMovieId = movieId;

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
