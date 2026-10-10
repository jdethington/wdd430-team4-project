import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateWatchlistItem, type WatchlistCategory } from "@/lib/watchlist";

const VALID_CATEGORIES: WatchlistCategory[] = [
  "wantToWatch",
  "watched",
  "rewatch",
];

export async function PATCH(
  request: Request,
  // Match folder name: [id] -> id (or rename folder to [itemId] -> itemId)
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Validate category if provided in the payload
  if (body.status && !VALID_CATEGORIES.includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid category. Must be wantToWatch, watched, or rewatch." },
      { status: 400 }
    );
  }

  // Validate rating range if provided
  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5." },
      { status: 400 }
    );
  }

  const updatedDoc = await updateWatchlistItem(session.user.id, id, {
    status: body.status,
    rating: body.rating,
    review: body.review,
  });

  return NextResponse.json({ success: true, watchlist: updatedDoc });
}