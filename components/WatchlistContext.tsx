"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Movie } from "@/components/MovieCard";

export type WatchlistCategory = "wantToWatch" | "watched" | "rewatch";

export interface WatchlistData {
  wantToWatch: Movie[];
  watched: Movie[];
  rewatch: Movie[];
}

export interface ReviewData {
  rating?: number;
  review?: string;
}

interface WatchlistContextValue {
  watchlist: WatchlistData;
  loading: boolean;
  error: string | null;
  /** id → category for search cards */
  statusById: Map<string, WatchlistCategory>;
  refresh: () => Promise<void>;
  /** After a successful Add: put movie in wantToWatch locally */
  addMovieOptimistic: (movie: Movie) => void;
  /** Undo optimistic add on failure or deletion */
  removeMovieOptimistic: (movieId: string) => void;
  /** Smoothly transfer a movie between categories locally */
  updateMovieCategoryOptimistic: (
    movieId: string,
    newCategory: WatchlistCategory
  ) => void;
  /** Update movie rating and review notes locally */
  updateMovieReviewOptimistic: (
    movieId: string,
    reviewData: ReviewData
  ) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function movieKey(m: { id?: string; _id?: string }): string | null {
  if (m.id && m.id.length > 0) return String(m.id);
  if (m._id) return String(m._id);
  return null;
}

/** Matches against provider id, mongodb _id, or computed movieKey */
function matchesId(m: Movie, targetId: string): boolean {
  if (!targetId) return false;
  const key = movieKey(m);
  const rawId = m.id ? String(m.id) : null;
  const rawMongoId = m._id ? String(m._id) : null;

  return key === targetId || rawId === targetId || rawMongoId === targetId;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistData>({
    wantToWatch: [],
    watched: [],
    rewatch: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to load watchlist");
      const data = await res.json();
      setWatchlist({
        wantToWatch: data.wantToWatch ?? [],
        watched: data.watched ?? [],
        rewatch: data.rewatch ?? [],
      });
    } catch {
      setError("Unable to load your watchlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [refresh]);

  const statusById = useMemo(() => {
    const map = new Map<string, WatchlistCategory>();
    for (const m of watchlist.wantToWatch) {
      const k = movieKey(m);
      if (k) map.set(k, "wantToWatch");
    }
    for (const m of watchlist.watched) {
      const k = movieKey(m);
      if (k) map.set(k, "watched");
    }
    for (const m of watchlist.rewatch) {
      const k = movieKey(m);
      if (k) map.set(k, "rewatch");
    }
    return map;
  }, [watchlist]);

  const addMovieOptimistic = useCallback((movie: Movie) => {
    const id = movieKey(movie);
    if (!id) return;

    setWatchlist((prev) => {
      const all = [...prev.wantToWatch, ...prev.watched, ...prev.rewatch];
      if (all.some((m) => matchesId(m, id))) return prev;

      return {
        ...prev,
        wantToWatch: [...prev.wantToWatch, movie],
      };
    });
  }, []);

  const removeMovieOptimistic = useCallback((movieId: string) => {
    setWatchlist((prev) => ({
      wantToWatch: prev.wantToWatch.filter((m) => !matchesId(m, movieId)),
      watched: prev.watched.filter((m) => !matchesId(m, movieId)),
      rewatch: prev.rewatch.filter((m) => !matchesId(m, movieId)),
    }));
  }, []);

  const updateMovieCategoryOptimistic = useCallback(
    (movieId: string, newCategory: WatchlistCategory) => {
      setWatchlist((prev) => {
        // Locate target item from whichever section it is currently in
        const all = [...prev.wantToWatch, ...prev.watched, ...prev.rewatch];
        const targetMovie = all.find((m) => matchesId(m, movieId));
        if (!targetMovie) return prev;

        // Remove from all existing sections
        const filtered: WatchlistData = {
          wantToWatch: prev.wantToWatch.filter((m) => !matchesId(m, movieId)),
          watched: prev.watched.filter((m) => !matchesId(m, movieId)),
          rewatch: prev.rewatch.filter((m) => !matchesId(m, movieId)),
        };

        // Add to target section with the updated status property
        return {
          ...filtered,
          [newCategory]: [
            ...filtered[newCategory],
            { ...targetMovie, status: newCategory },
          ],
        };
      });
    },
    []
  );

  const updateMovieReviewOptimistic = useCallback(
    (movieId: string, reviewData: ReviewData) => {
      setWatchlist((prev) => {
        const updateList = (list: Movie[]) =>
          list.map((m) =>
            matchesId(m, movieId) ? { ...m, ...reviewData } : m
          );

        return {
          wantToWatch: updateList(prev.wantToWatch),
          watched: updateList(prev.watched),
          rewatch: updateList(prev.rewatch),
        };
      });
    },
    []
  );

  const value: WatchlistContextValue = {
    watchlist,
    loading,
    error,
    statusById,
    refresh,
    addMovieOptimistic,
    removeMovieOptimistic,
    updateMovieCategoryOptimistic,
    updateMovieReviewOptimistic,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return ctx;
}
