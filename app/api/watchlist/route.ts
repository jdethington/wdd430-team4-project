import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError, ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import {
  createWatchlistEntry,
  findWatchlistEntry,
} from "@/lib/watchlist";

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
});

/**
 * POST /api/watchlist
 * Requires authentication.
 * Creates one WatchlistEntry with category want-to-watch.
 * Prevents duplicate entries for the same user + movie.
 * Returns the created entry.
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

    // Verify the movie exists in the catalog (by provider id or MongoDB _id).
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

    // Prefer the stable provider id when available; fall back to MongoDB _id.
    const resolvedMovieId =
      typeof movie.id === "string" && movie.id.length > 0
        ? movie.id
        : movie._id.toString();

    const existing = await findWatchlistEntry(userId, resolvedMovieId);

    if (existing) {
      return NextResponse.json(
        {
          error: "This movie is already in your watchlist.",
          entry: {
            id: existing._id?.toString(),
            userId: existing.userId,
            movieId: existing.movieId,
            category: existing.category,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          },
        },
        { status: 409 },
      );
    }

    const entry = await createWatchlistEntry(
      userId,
      resolvedMovieId,
      "want-to-watch",
    );

    return NextResponse.json(
      {
        id: entry._id?.toString(),
        userId: entry.userId,
        movieId: entry.movieId,
        category: entry.category,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    // Race condition: two concurrent adds for the same user+movie.
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
