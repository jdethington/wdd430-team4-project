import { getDb } from "@/lib/db";

export type WatchlistCategory = "wantToWatch" | "watched" | "rewatch";

export interface WatchlistDocument {
  userId: string;
  wantToWatch: string[];
  watched: string[];
  rewatch: string[];
}

const EMPTY_LISTS = {
  wantToWatch: [] as string[],
  watched: [] as string[],
  rewatch: [] as string[],
};

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
