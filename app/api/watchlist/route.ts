import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { addMovieToWantToWatch } from "@/lib/watchlist";
import { ensureMovieInDb, upsertMovie } from "@/lib/movies";
import {
  findMovieByRef,
  findMoviesByRefs,
  indexMoviesByAnyId,
  resolveMovieKey,
} from "@/lib/movie-ids";

const VALID_CATEGORIES = ["wantToWatch", "watched", "rewatch"] as const;

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
  // Snapshot from search — optional; used to avoid a second API call when possible.
  movie: z
    .object({
      title: z.string(),
      releaseYear: z.number().nullable().optional(),
      description: z.string().optional(),
      genre: z.string().optional(),
      posterUrl: z.string().nullable().optional(),
      imdbId: z.string().optional(),
      tmdbId: z.string().optional(),
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

    // Match stored refs against imdbId, tmdbId, or id
    const movies = await findMoviesByRefs(allIds);
    const movieMap = indexMoviesByAnyId(movies);

    const reviews: Record<string, { rating?: number; review?: string }> =
      watchlistDoc.reviews ?? {};

    const sanitizeMovie = (movie: (typeof movies)[number]) => {
      const id = resolveMovieKey(movie); // imdbId → tmdbId → id
      const reviewData =
        reviews[id] ??
        reviews[String(movie.imdbId ?? "")] ??
        reviews[String(movie.tmdbId ?? "")] ??
        reviews[String(movie.id ?? "")] ??
        {};

      return {
        _id: movie._id.toString(),
        id, // preferred stable key for the client / future writes
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
        rating: reviewData.rating,
        review: reviewData.review,
      };
    };

    const getMovies = (ids: string[]) =>
      ids
        .map((ref) => movieMap.get(ref))
        .filter((movie): movie is NonNullable<typeof movie> => movie != null)
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
 * Ensures the movie exists locally (upsert from payload or Streaming Availability),
 * then adds the preferred stable id (imdbId → tmdbId → id) to wantToWatch.
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

    // Prefer an existing local document matched by imdbId → tmdbId → id
    let movieDoc = await findMovieByRef(movieId);

    if (!movieDoc && moviePayload) {
      // Upsert from search snapshot when we don't have a full DB row yet.
      // Prefer ids from the payload when present; fall back to movieId.
      await upsertMovie({
        id: movieId,
        imdbId: moviePayload.imdbId,
        tmdbId: moviePayload.tmdbId,
        title: moviePayload.title,
        releaseYear: moviePayload.releaseYear ?? undefined,
        overview: moviePayload.description ?? "",
        genres: moviePayload.genre
          ? moviePayload.genre.split(", ").map((name) => ({
              id: name.toLowerCase(),
              name,
            }))
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

      movieDoc = await findMovieByRef(movieId);
    }

    if (!movieDoc) {
      // Full fetch + upsert from Streaming Availability
      const ensured = await ensureMovieInDb(movieId);
      if (!ensured) {
        return NextResponse.json(
          { error: "Movie not found." },
          { status: 404 },
        );
      }
      movieDoc = await findMovieByRef(movieId);
    }

    if (!movieDoc) {
      return NextResponse.json({ error: "Movie not found." }, { status: 404 });
    }

    // Stable key for watchlist membership: imdbId → tmdbId → id
    const resolvedMovieId = resolveMovieKey(movieDoc);

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

    if (error instanceof MongoServerError && error.code === 121) {
      console.error(
        "Movie document failed validation:",
        JSON.stringify(error.errInfo, null, 2),
      );
    }

    console.error("Add to watchlist error:", error);

    return NextResponse.json(
      { error: "Unable to add movie to watchlist. Please try again." },
      { status: 500 },
    );
  }
}
