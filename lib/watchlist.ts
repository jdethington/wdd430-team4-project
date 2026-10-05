import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export const WATCHLIST_CATEGORIES = [
    "want-to-watch",
    "watched",
    "want-to-rewatch",
] as const;

export type WatchlistCategory = (typeof WATCHLIST_CATEGORIES)[number];

export interface WatchlistMovie {
    id: string;
    title: string;
    year?: string;
    summary?: string;
    posterUrl?: string;
}

export interface WatchlistEntry {
    _id?: ObjectId;
    userId: ObjectId;
    movieId: string;
    movie: WatchlistMovie;
    category: WatchlistCategory;
    rating?: number | null;
    review?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface WatchlistEntryData {
    id: string;
    movieId: string;
    movie: WatchlistMovie;
    category: WatchlistCategory;
    rating?: number | null;
    review?: string | null;
    createdAt: string;
    updatedAt: string;
}

async function getWatchlistCollection() {
    const db = await getDb();
    const collection = db.collection<WatchlistEntry>("watchlist");

    await collection.createIndex({ userId: 1, movieId: 1 }, { unique: true });

    return collection;
}

export function toWatchlistEntryData(entry: WatchlistEntry): WatchlistEntryData {
    if (!entry._id) {
        throw new Error("Watchlist entry is missing its database ID");
    }

    return {
        id: entry._id.toString(),
        movieId: entry.movieId,
        movie: entry.movie,
        category: entry.category,
        rating: entry.rating,
        review: entry.review,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
    };
}

export function parseUserId(id: unknown): ObjectId | null {
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
        return null;
    }

    return new ObjectId(id);
}

export async function getUserWatchlist(
    userId: ObjectId,
    category?: WatchlistCategory,
): Promise<WatchlistEntry[]> {
    const collection = await getWatchlistCollection();
    const filter = category ? { userId, category } : { userId };

    return collection.find(filter).sort({ updatedAt: -1 }).toArray();
}

export async function getUserWatchlistEntry(
    userId: ObjectId,
    itemId: ObjectId,
): Promise<WatchlistEntry | null> {
    const collection = await getWatchlistCollection();

    return collection.findOne({ _id: itemId, userId });
}

export async function createWatchlistEntry(
    userId: ObjectId,
    movie: WatchlistMovie,
    category: WatchlistCategory,
): Promise<WatchlistEntry> {
    const collection = await getWatchlistCollection();
    const now = new Date();
    const entry: WatchlistEntry = {
        userId,
        movieId: movie.id,
        movie,
        category,
        createdAt: now,
        updatedAt: now,
    };
    const result = await collection.insertOne(entry);

    return { ...entry, _id: result.insertedId };
}

export async function updateUserWatchlistEntry(
    userId: ObjectId,
    itemId: ObjectId,
    updates: Partial<Pick<WatchlistEntry, "category" | "rating" | "review">>,
): Promise<WatchlistEntry | null> {
    const collection = await getWatchlistCollection();
    const result = await collection.findOneAndUpdate(
        { _id: itemId, userId },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
    );

    return result ?? null;
}

export async function deleteUserWatchlistEntry(
    userId: ObjectId,
    itemId: ObjectId,
): Promise<boolean> {
    const collection = await getWatchlistCollection();
    const result = await collection.deleteOne({ _id: itemId, userId });

    return result.deletedCount === 1;
}