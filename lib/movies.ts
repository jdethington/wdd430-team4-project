// lib/movies.ts
import { getDb } from "@/lib/db";
import {
  findMovieByRef,
  movieLookupFilter,
  resolveMovieKey,
} from "@/lib/movie-ids";
import { formatTmdbId, getTmdbMovieDetails } from "@/lib/tmdb";
import {
  fetchGlobalWhereToWatch,
  type CountryStreaming,
} from "@/lib/streaming";

/** Refresh MotN global snapshot at most this often */
const days = 15; // 15 days
export const STREAMING_MAX_AGE_MS = days * 24 * 60 * 60 * 1000;

export type MovieDocument = {
  id: string;
  imdbId: string;
  tmdbId: string;
  title: string;
  /** ISO country code → options (from one global MotN fetch) */
  whereToWatchByCountry: Record<string, CountryStreaming>;
  /** Last MotN global fetch */
  streamingUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function isStreamingStale(
  streamingUpdatedAt: Date | string | undefined | null,
): boolean {
  if (!streamingUpdatedAt) return true;
  const t =
    streamingUpdatedAt instanceof Date
      ? streamingUpdatedAt.getTime()
      : new Date(streamingUpdatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > STREAMING_MAX_AGE_MS;
}

export async function upsertLeanMovie(doc: MovieDocument): Promise<void> {
  const db = await getDb();
  const lookupKey = doc.imdbId || doc.tmdbId || doc.id;

  await db.collection("movies").updateOne(
    movieLookupFilter(lookupKey),
    {
      $set: {
        id: doc.id,
        imdbId: doc.imdbId,
        tmdbId: doc.tmdbId,
        title: doc.title,
        whereToWatchByCountry: doc.whereToWatchByCountry,
        streamingUpdatedAt: doc.streamingUpdatedAt,
        updatedAt: doc.updatedAt,
      },
      $setOnInsert: {
        createdAt: doc.createdAt,
      },
    },
    { upsert: true },
  );
}

/**
 * Detail-page path only:
 * - Missing → TMDB title/ids + MotN global where-to-watch → insert
 * - Present + stale streaming → MotN again, update map + timestamps
 * - Present + fresh → return as-is
 *
 * Does NOT store posters/cast/overview (those stay TMDB at render time).
 */
export async function getOrCreateMovieRecord(
  ref: string,
): Promise<MovieDocument | null> {
  const existing = (await findMovieByRef(ref)) as MovieDocument | null;

  if (existing && !isStreamingStale(existing.streamingUpdatedAt)) {
    return {
      ...existing,
      streamingUpdatedAt: new Date(existing.streamingUpdatedAt),
      createdAt: new Date(existing.createdAt),
      updatedAt: new Date(existing.updatedAt),
    };
  }

  const details = await getTmdbMovieDetails(ref);
  if (!details && !existing) return null;

  const imdbId =
    details?.imdb_id ||
    details?.external_ids?.imdb_id ||
    existing?.imdbId ||
    "";
  const tmdbId = details ? formatTmdbId(details.id) : existing?.tmdbId || "";
  const id = imdbId || tmdbId || existing?.id || ref;
  const title = details?.title || existing?.title || "Untitled";

  // MotN: prefer imdb id; fall back to ref
  const motnId = imdbId || ref;
  const whereToWatchByCountry = await fetchGlobalWhereToWatch(motnId);
  const now = new Date();

  const doc: MovieDocument = {
    id,
    imdbId: imdbId || "",
    tmdbId: tmdbId || "",
    title,
    whereToWatchByCountry:
      Object.keys(whereToWatchByCountry).length > 0
        ? whereToWatchByCountry
        : (existing?.whereToWatchByCountry ?? {}),
    streamingUpdatedAt: now,
    createdAt: existing?.createdAt ? new Date(existing.createdAt) : now,
    updatedAt: now,
  };

  await upsertLeanMovie(doc);
  return doc;
}

export function optionsForCountry(
  movie: MovieDocument | null | undefined,
  country: string,
) {
  const code = country.toLowerCase();
  return movie?.whereToWatchByCountry?.[code]?.options ?? [];
}

// Re-export resolve for watchlist POST
export { resolveMovieKey };
