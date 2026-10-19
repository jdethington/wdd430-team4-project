// lib/movies.ts
import { getDb } from "@/lib/db";
import * as streamingAvailability from "streaming-availability";
import {
  findMovieByRef,
  movieLookupFilter,
  resolveMovieKey,
} from "@/lib/movie-ids";

/** Shape returned to the frontend (matches MovieCard) */
export type MovieResponse = {
  id: string;
  _id: string;
  title: string;
  releaseYear: number | null;
  description: string;
  genre: string;
  posterUrl: string | null;
  imdbId?: string;
  tmdbId?: string;
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
  const preferredId = resolveMovieKey({
    imdbId: show.imdbId,
    tmdbId: show.tmdbId,
    id: show.id,
  });

  return {
    id: preferredId,
    _id: preferredId,
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
    imdbId: show.imdbId || undefined,
    tmdbId: show.tmdbId || undefined,
  };
}

/**
 * Map a Show → document that matches the MongoDB JSON Schema
 * (same shape as seeded movies from movies.json / Streaming Availability).
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

type MovieDoc = ReturnType<typeof mapShowToMovieDocument>;

/**
 * Accept either a full Streaming Availability Show or a partial snapshot
 * (e.g. from the search POST body) and normalize to a schema-safe doc.
 */
function toMovieDocument(
  input: streamingAvailability.Show | (Partial<MovieDoc> & { id: string }),
): MovieDoc {
  // Full API show
  if (
    "itemType" in input ||
    "showType" in input ||
    ("imageSet" in input &&
      input.imageSet &&
      "horizontalBackdrop" in (input.imageSet as object))
  ) {
    // Prefer treating API shows via mapShowToMovieDocument when possible
    if ("imdbId" in input && "title" in input && "overview" in input) {
      try {
        return mapShowToMovieDocument(input as streamingAvailability.Show);
      } catch {
        // fall through to partial path
      }
    }
  }

  // Partial / client snapshot path
  const partial = input as Partial<MovieDoc> & { id: string };
  return {
    itemType: partial.itemType ?? "show",
    showType: partial.showType ?? "movie",
    id: partial.id,
    imdbId: partial.imdbId ?? "",
    tmdbId: partial.tmdbId ?? "",
    title: partial.title ?? "Untitled",
    overview: partial.overview ?? "",
    releaseYear: partial.releaseYear ?? 0,
    originalTitle: partial.originalTitle ?? partial.title ?? "Untitled",
    genres: (partial.genres ?? []).map((g) => ({
      id: g.id ?? g.name?.toLowerCase() ?? "",
      name: g.name ?? "",
    })),
    directors: partial.directors ?? [],
    cast: partial.cast ?? [],
    rating: partial.rating ?? 0,
    runtime: partial.runtime ?? 0,
    imageSet: {
      verticalPoster: {
        w240: partial.imageSet?.verticalPoster?.w240 ?? "",
        w360: partial.imageSet?.verticalPoster?.w360 ?? "",
        w480: partial.imageSet?.verticalPoster?.w480 ?? "",
        w600: partial.imageSet?.verticalPoster?.w600 ?? "",
        w720: partial.imageSet?.verticalPoster?.w720 ?? "",
      },
      horizontalBackdrop: {
        w360: partial.imageSet?.horizontalBackdrop?.w360 ?? "",
        w480: partial.imageSet?.horizontalBackdrop?.w480 ?? "",
        w720: partial.imageSet?.horizontalBackdrop?.w720 ?? "",
        w1080: partial.imageSet?.horizontalBackdrop?.w1080 ?? "",
        w1440: partial.imageSet?.horizontalBackdrop?.w1440 ?? "",
      },
    },
  };
}

/**
 * Upsert into movies collection.
 * Matches existing rows by imdbId → tmdbId → id so we don't create duplicates.
 */
export async function upsertMovie(
  show: streamingAvailability.Show | (Partial<MovieDoc> & { id: string }),
): Promise<MovieDoc> {
  const db = await getDb();
  const doc = toMovieDocument(show);

  const lookupKey = doc.imdbId || doc.tmdbId || doc.id;

  await db
    .collection("movies")
    .updateOne(movieLookupFilter(lookupKey), { $set: doc }, { upsert: true });

  return doc;
}

/**
 * Ensure a movie exists locally.
 * - Lookup by imdbId → tmdbId → id
 * - If missing, fetch from Streaming Availability and upsert full doc
 * - Returns preferred stable key (imdbId → tmdbId → id)
 */
export async function ensureMovieInDb(
  movieRef: string,
): Promise<{ id: string } | null> {
  const existing = await findMovieByRef(movieRef);
  if (existing) {
    return { id: resolveMovieKey(existing) };
  }

  try {
    const client = getClient();
    const show = await client.showsApi.getShow({
      id: movieRef,
      country: "us",
    });
    const doc = await upsertMovie(show);
    return {
      id: resolveMovieKey({
        imdbId: doc.imdbId,
        tmdbId: doc.tmdbId,
        id: doc.id,
      }),
    };
  } catch (err) {
    console.error(`Failed to fetch movie ${movieRef} from API:`, err);
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
