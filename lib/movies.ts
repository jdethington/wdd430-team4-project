// lib/movies.ts
import { getDb } from "@/lib/db";
import * as streamingAvailability from "streaming-availability";

export type MovieDocument = {
  id: string;
  title: string;
  releaseYear: number | null;
  overview: string;
  genres: { name: string }[];
  imageSet?: {
    verticalPoster?: {
      w240?: string | null;
      w360?: string | null;
    };
  };
  source: "streaming-availability";
  updatedAt: Date;
};

/** Shape returned to the frontend (matches MovieCard) */
export type MovieResponse = {
  id: string;
  _id: string;
  title: string;
  releaseYear: number | null;
  description: string;
  genre: string;
  posterUrl: string | null;
};

function getClient() {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STREAMING_AVAILABILITY_API_KEY is not set");
  }
  return new streamingAvailability.Client(
    new streamingAvailability.Configuration({ apiKey }),
  );
}

/** Map a Streaming Availability Show → frontend MovieResponse */
export function mapShowToMovieResponse(
  show: streamingAvailability.Show,
): MovieResponse {
  return {
    id: show.id,
    _id: show.id,
    title: show.title,
    releaseYear: show.releaseYear ?? null,
    description: show.overview || "No description available.",
    genre:
      show.genres
        ?.map((g) => g.name)
        .filter(Boolean)
        .join(", ") ?? "",
    posterUrl:
      show.imageSet?.verticalPoster?.w240 ??
      show.imageSet?.verticalPoster?.w360 ??
      null,
  };
}

/** Map a Show → document we store in MongoDB
 * Build a document that matches the existing MongoDB JSON Schema
 * (same shape as the seeded movies from movies.json / Streaming Availability).
 */
export function mapShowToMovieDocument(show: streamingAvailability.Show) {
  return {
    itemType: show.itemType ?? "show",
    showType: show.showType ?? "movie",
    id: show.id,
    imdbId: show.imdbId ?? "",
    tmdbId: show.tmdbId ?? "",
    title: show.title,
    overview: show.overview ?? "",
    releaseYear: show.releaseYear ?? 0,
    originalTitle: show.originalTitle ?? show.title,
    genres: (show.genres ?? []).map((g) => ({
      id: g.id ?? g.name?.toLowerCase() ?? "",
      name: g.name ?? "",
    })),
    directors: show.directors ?? [],
    cast: show.cast ?? [],
    rating: show.rating ?? 0,
    runtime: show.runtime ?? 0,
    imageSet: {
      verticalPoster: {
        w240: show.imageSet?.verticalPoster?.w240 ?? "",
        w360: show.imageSet?.verticalPoster?.w360 ?? "",
        w480: show.imageSet?.verticalPoster?.w480 ?? "",
        w600: show.imageSet?.verticalPoster?.w600 ?? "",
        w720: show.imageSet?.verticalPoster?.w720 ?? "",
      },
      horizontalBackdrop: {
        w360: show.imageSet?.horizontalBackdrop?.w360 ?? "",
        w480: show.imageSet?.horizontalBackdrop?.w480 ?? "",
        w720: show.imageSet?.horizontalBackdrop?.w720 ?? "",
        w1080: show.imageSet?.horizontalBackdrop?.w1080 ?? "",
        w1440: show.imageSet?.horizontalBackdrop?.w1440 ?? "",
      },
    },
  };
}

/**
 * Upsert a movie into the local movies collection.
 * Uses `id` (Streaming Availability / IMDb-style id) as the stable key.
 */
export async function upsertMovie(
  show: streamingAvailability.Show,
): Promise<ReturnType<typeof mapShowToMovieDocument>> {
  const db = await getDb();
  const doc = mapShowToMovieDocument(show);

  await db
    .collection("movies")
    .updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
  return doc;
}

/**
 * Ensure a movie exists locally.
 * - If already in MongoDB → return it
 * - Else fetch from Streaming Availability API and upsert
 */
export async function ensureMovieInDb(
  movieId: string,
): Promise<{ id: string } | null> {
  const db = await getDb();
  const existing = await db.collection("movies").findOne({ id: movieId });
  if (existing) {
    return { id: String(existing.id) };
  }

  try {
    const client = getClient();
    const show = await client.showsApi.getShow({
      id: movieId,
      country: "us",
    });
    const doc = await upsertMovie(show);
    return { id: doc.id };
  } catch (err) {
    console.error(`Failed to fetch movie ${movieId} from API:`, err);
    return null;
  }
}

/** Search by title via Streaming Availability API */
export async function searchMoviesByTitle(
  title: string,
  country = "us",
): Promise<MovieResponse[]> {
  const client = getClient();
  const shows = await client.showsApi.searchShowsByTitle({
    title,
    country,
    showType: streamingAvailability.ShowType.Movie,
  });
  return shows.map(mapShowToMovieResponse);
}
