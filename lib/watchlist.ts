import { getDb } from "@/lib/db";

export type WatchlistCategory = "wantToWatch" | "watched" | "rewatch";

export interface MovieReview {
  rating?: number;
  review?: string;
  updatedAt?: Date;
}

export interface WatchlistDocument {
  userId: string;
  wantToWatch: string[];
  watched: string[];
  rewatch: string[];
  reviews?: Record<string, MovieReview>;
}

export interface UpdateWatchlistParams {
  status?: WatchlistCategory;
  rating?: number;
  review?: string;
}

const EMPTY_LISTS = {
  wantToWatch: [] as string[],
  watched: [] as string[],
  rewatch: [] as string[],
};

/**
 * Updates an item's status category and/or review details in the user's watchlist document.
 */
export async function updateWatchlistItem(
  userId: string,
  movieId: string,
  updates: UpdateWatchlistParams,
): Promise<WatchlistDocument | null> {
  const watchlist = await getWatchlistCollection();

  // 1. If status is provided, remove movieId from all three lists and add to target category
  if (updates.status) {
    await watchlist.updateOne(
      { userId },
      {
        $pull: {
          wantToWatch: movieId,
          watched: movieId,
          rewatch: movieId,
        },
      },
    );

    await watchlist.updateOne(
      { userId },
      {
        $addToSet: { [updates.status]: movieId },
      },
    );
  }

  // 2. If review notes or rating are provided, store/merge into the reviews map
  if (updates.rating !== undefined || updates.review !== undefined) {
    const reviewData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (updates.rating !== undefined) reviewData.rating = updates.rating;
    if (updates.review !== undefined) reviewData.review = updates.review;

    return watchlist.findOneAndUpdate(
      { userId },
      {
        $set: {
          [`reviews.${movieId}`]: reviewData,
        },
      },
      { returnDocument: "after" },
    );
  }

  // Return the updated document
  return watchlist.findOne({ userId });
}

const getWatchlistCollection = async () => {
  const db = await getDb();
  const watchlist = db.collection<WatchlistDocument>("watchlist");

  // One document per user.
  await watchlist.createIndex({ userId: 1 }, { unique: true });

  return watchlist;
};

export async function getWatchlistDoc(
  userId: string,
): Promise<WatchlistDocument | null> {
  const watchlist = await getWatchlistCollection();
  return watchlist.findOne({ userId });
}

/**
 * Returns which category a movie is in, or null if not in the list.
 */
export function findMovieCategory(
  doc: WatchlistDocument,
  movieId: string,
): WatchlistCategory | null {
  if (doc.wantToWatch.includes(movieId)) return "wantToWatch";
  if (doc.watched.includes(movieId)) return "watched";
  if (doc.rewatch.includes(movieId)) return "rewatch";
  return null;
}

/**
 * Add movieId to wantToWatch.
 * - Creates the user doc if missing.
 * - If the movie is not in the movies collection, it is added.
 * - Returns { created: true, doc } on success.
 * - Returns { created: false, doc, category } if movie already present in any list.
 */
export async function addMovieToWantToWatch(
  userId: string,
  movieId: string,
): Promise<
  | { created: true; doc: WatchlistDocument }
  | { created: false; doc: WatchlistDocument; category: WatchlistCategory }
> {
  const watchlist = await getWatchlistCollection();
  const existing = await watchlist.findOne({ userId });

  if (!existing) {
    const doc: WatchlistDocument = {
      userId,
      ...EMPTY_LISTS,
      wantToWatch: [movieId],
    };
    await watchlist.insertOne(doc);
    return { created: true, doc };
  }

  const category = findMovieCategory(existing, movieId);
  if (category) {
    return { created: false, doc: existing, category };
  }

  await watchlist.updateOne(
    { userId },
    { $addToSet: { wantToWatch: movieId } },
  );

  return {
    created: true,
    doc: {
      ...existing,
      wantToWatch: [...existing.wantToWatch, movieId],
    },
  };
}
