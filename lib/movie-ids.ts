// lib/movie-ids.ts
import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/db";

/**
 * Preferred stable key for a movie document / watchlist membership:
 * imdbId → tmdbId → id → _id
 */
export function resolveMovieKey(movie: {
  imdbId?: string | null;
  tmdbId?: string | null;
  id?: string | null;
  _id?: { toString(): string } | string;
}): string {
  if (typeof movie.imdbId === "string" && movie.imdbId.trim()) {
    return movie.imdbId.trim();
  }
  if (typeof movie.tmdbId === "string" && movie.tmdbId.trim()) {
    return movie.tmdbId.trim();
  }
  if (typeof movie.id === "string" && movie.id.trim()) {
    return movie.id.trim();
  }
  if (movie._id) {
    return typeof movie._id === "string" ? movie._id : movie._id.toString();
  }
  throw new Error("Movie document has no usable identifier");
}

/**
 * Build a Mongo $or query that matches imdbId, then tmdbId, then id
 * (and optionally _id when the value looks like an ObjectId).
 */
export function movieLookupFilter(movieRef: string): Document {
  const value = movieRef.trim();
  const clauses: Document[] = [
    { imdbId: value },
    { tmdbId: value },
    { id: value },
  ];

  if (ObjectId.isValid(value)) {
    clauses.push({ _id: new ObjectId(value) });
  }

  return { $or: clauses };
}

/**
 * Match any of several refs against imdbId / tmdbId / id.
 * Useful when loading a watchlist that may mix identifier types.
 */
export function moviesLookupFilter(movieRefs: string[]): Document {
  const values = [...new Set(movieRefs.map((v) => v.trim()).filter(Boolean))];
  if (values.length === 0) {
    return { _id: { $exists: false } }; // matches nothing
  }

  return {
    $or: [
      { imdbId: { $in: values } },
      { tmdbId: { $in: values } },
      { id: { $in: values } },
    ],
  };
}

/** Find one movie by imdbId → tmdbId → id (→ _id). */
export async function findMovieByRef(movieRef: string) {
  const db = await getDb();
  return db.collection("movies").findOne(movieLookupFilter(movieRef));
}

/** Find many movies by a list of refs (any of the three id fields). */
export async function findMoviesByRefs(movieRefs: string[]) {
  const db = await getDb();
  const values = [...new Set(movieRefs.map((v) => v.trim()).filter(Boolean))];
  if (values.length === 0) return [];

  return db.collection("movies").find(moviesLookupFilter(values)).toArray();
}

/**
 * Index a list of movie docs so they can be retrieved by any known id
 * that was stored on the watchlist (imdbId, tmdbId, or id).
 */
export function indexMoviesByAnyId<T extends Document>(
  movies: T[],
): Map<string, T> {
  const map = new Map<string, T>();

  for (const movie of movies) {
    const keys = [movie.imdbId, movie.tmdbId, movie.id]
      .filter((k): k is string => typeof k === "string" && k.length > 0)
      .map((k) => k.trim());

    for (const key of keys) {
      map.set(key, movie);
    }
  }

  return map;
}
