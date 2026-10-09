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

interface WatchlistContextValue {
  watchlist: WatchlistData;
  loading: boolean;
  error: string | null;
  /** id → category for search cards */
  statusById: Map<string, WatchlistCategory>;
  refresh: () => Promise<void>;
  /** After a successful Add: put movie in wantToWatch locally */
  addMovieOptimistic: (movie: Movie) => void;
  /** Undo optimistic add on failure */
  removeMovieOptimistic: (movieId: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function movieKey(m: { id?: string; _id?: string }): string | null {
  if (m.id && m.id.length > 0) return m.id;
  if (m._id) return String(m._id);
  return null;
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
      // already somewhere?
      const all = [...prev.wantToWatch, ...prev.watched, ...prev.rewatch];
      if (all.some((m) => movieKey(m) === id)) return prev;

      return {
        ...prev,
        wantToWatch: [...prev.wantToWatch, movie],
      };
    });
  }, []);

  const removeMovieOptimistic = useCallback((movieId: string) => {
    setWatchlist((prev) => ({
      wantToWatch: prev.wantToWatch.filter((m) => movieKey(m) !== movieId),
      watched: prev.watched.filter((m) => movieKey(m) !== movieId),
      rewatch: prev.rewatch.filter((m) => movieKey(m) !== movieId),
    }));
  }, []);

  const value: WatchlistContextValue = {
    watchlist,
    loading,
    error,
    statusById,
    refresh,
    addMovieOptimistic,
    removeMovieOptimistic,
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
