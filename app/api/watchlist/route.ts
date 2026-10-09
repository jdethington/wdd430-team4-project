import { NextResponse } from "next/server";
import { z } from "zod";
import { MongoServerError, ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { addMovieToWantToWatch } from "@/lib/watchlist";

const AddToWatchlistSchema = z.object({
  movieId: z.string().trim().min(1, "movieId is required."),
});

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

    // Verify movie exists (provider id or MongoDB _id).
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

    // Prefer stable provider id — GET looks up movies by `id`.
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
    // Concurrent first-create for the same user.
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
