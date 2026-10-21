// lib/tmdb.ts
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function authHeaders(): HeadersInit {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB_ACCESS_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

export type TmdbSearchMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
};

export type TmdbMovieDetails = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  original_title?: string;
  imdb_id?: string | null;
  external_ids?: { imdb_id?: string | null };
  credits?: {
    cast?: { name: string; order?: number }[];
    crew?: { job: string; name: string }[];
  };
};

export function formatTmdbId(numericId: number | string): string {
  const n = String(numericId).replace(/^movie\//, "");
  return `movie/${n}`;
}

export function posterUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" = "w500",
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" = "w1280",
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export async function searchTmdbMovies(
  query: string,
  page = 1,
): Promise<{ results: TmdbSearchMovie[]; total_results: number }> {
  const url = new URL(`${TMDB_BASE}/search/movie`);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  return res.json();
}

export async function getTmdbMovieDetails(
  tmdbId: number | string,
): Promise<TmdbMovieDetails | null> {
  const id = String(tmdbId).replace(/^movie\//, "");
  const url = new URL(`${TMDB_BASE}/movie/${id}`);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("append_to_response", "credits,external_ids");

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TMDB details failed: ${res.status}`);
  return res.json();
}

/** Card / list shape — not written to Mongo */
export function mapTmdbSearchToMovieResponse(m: TmdbSearchMovie) {
  const tmdbId = formatTmdbId(m.id);
  return {
    id: tmdbId,
    _id: tmdbId,
    title: m.title,
    releaseYear: m.release_date
      ? Number(m.release_date.slice(0, 4)) || null
      : null,
    description: m.overview || "No description available.",
    genre: "",
    posterUrl: posterUrl(m.poster_path, "w342"),
    tmdbId,
    imdbId: "" as string,
  };
}

/** Hydrate a watchlist id via TMDB for dashboard cards */
export async function hydrateMovieCardFromTmdb(ref: string) {
  const details = await getTmdbMovieDetails(ref);
  if (!details) return null;

  const imdbId = details.imdb_id || details.external_ids?.imdb_id || "";
  const tmdbId = formatTmdbId(details.id);
  const id = imdbId || tmdbId;

  return {
    id,
    _id: id,
    title: details.title,
    releaseYear: details.release_date
      ? Number(details.release_date.slice(0, 4)) || null
      : null,
    description: details.overview || "No description available.",
    genre: (details.genres ?? []).map((g) => g.name).join(", "),
    posterUrl: posterUrl(details.poster_path, "w342"),
    tmdbId,
    imdbId,
  };
}
