import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  updateWatchlistItem,
  type WatchlistCategory,
  type WatchlistDocument,
} from "@/lib/watchlist";
import { getDb } from "@/lib/db";

const VALID_CATEGORIES: WatchlistCategory[] = [
  "wantToWatch",
  "watched",
  "rewatch",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const body = await request.json();

  if (body.status && !VALID_CATEGORIES.includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid category. Must be wantToWatch, watched, or rewatch." },
      { status: 400 },
    );
  }

  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5." },
      { status: 400 },
    );
  }

  const updatedDoc = await updateWatchlistItem(session.user.id, itemId, {
    status: body.status,
    rating: body.rating,
    review: body.review,
  });

  return NextResponse.json({ success: true, watchlist: updatedDoc });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { itemId } = await params;

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const db = await getDb();

    const watchlistDoc = await db.collection("watchlist").findOne({ userId });

    if (!watchlistDoc) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 },
      );
    }

    const inWantToWatch = watchlistDoc.wantToWatch?.includes(itemId);
    const inWatched = watchlistDoc.watched?.includes(itemId);
    const inRewatch = watchlistDoc.rewatch?.includes(itemId);

    if (!inWantToWatch && !inWatched && !inRewatch) {
      return NextResponse.json(
        { error: "Movie not found in watchlist" },
        { status: 404 },
      );
    }

    // Remove from arrays AND clean up orphaned review data
    await db.collection<WatchlistDocument>("watchlist").updateOne(
      { userId },
      {
        $pull: {
          wantToWatch: itemId,
          watched: itemId,
          rewatch: itemId,
        },
        $unset: {
          [`reviews.${itemId}`]: "",
        },
      },
    );

    return NextResponse.json(
      { message: "Movie removed from watchlist" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove movie from watchlist" },
      { status: 500 },
    );
  }
}
