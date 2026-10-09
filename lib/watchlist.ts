import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export type WatchlistCategory =
  | "want-to-watch"
  | "watched"
  | "want-to-rewatch";

export interface WatchlistEntry {
  _id?: ObjectId;
  userId: string;
  movieId: string;
  category: WatchlistCategory;
  createdAt: Date;
  updatedAt: Date;
}

const getWatchlistCollection = async () => {
  const db = await getDb();
  const watchlist = db.collection<WatchlistEntry>("watchlistEntries");

  // One entry per user + movie.
  await watchlist.createIndex(
    { userId: 1, movieId: 1 },
    { unique: true },
  );

  return watchlist;
};

export async function findWatchlistEntry(
  userId: string,
  movieId: string,
): Promise<WatchlistEntry | null> {
  const watchlist = await getWatchlistCollection();
  return watchlist.findOne({ userId, movieId });
}

export async function createWatchlistEntry(
  userId: string,
  movieId: string,
  category: WatchlistCategory = "want-to-watch",
): Promise<WatchlistEntry> {
  const watchlist = await getWatchlistCollection();
  const now = new Date();

  const entry: WatchlistEntry = {
    userId,
    movieId,
    category,
    createdAt: now,
    updatedAt: now,
  };

  const result = await watchlist.insertOne(entry);

  return {
    ...entry,
    _id: result.insertedId,
  };
}
