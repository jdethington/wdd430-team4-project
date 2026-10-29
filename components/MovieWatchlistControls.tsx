"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ReviewModal from "@/components/ReviewModal";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/ui/Toast";

type WatchlistStatus = "wantToWatch" | "watched" | "rewatch";

const STATUS_LABELS: Record<WatchlistStatus, string> = {
  wantToWatch: "Want to Watch",
  watched: "Watched",
  rewatch: "Want to Rewatch",
};

type ListMovie = {
  id?: string;
  _id?: string;
  rating?: number;
  review?: string;
};

function findInList(
  data: {
    wantToWatch?: ListMovie[];
    watched?: ListMovie[];
    rewatch?: ListMovie[];
  },
  movieId: string,
): { status: WatchlistStatus; movie: ListMovie } | null {
  const match = (m: ListMovie) => m.id === movieId || m._id === movieId;

  for (const m of data.wantToWatch ?? []) {
    if (match(m)) return { status: "wantToWatch", movie: m };
  }
  for (const m of data.watched ?? []) {
    if (match(m)) return { status: "watched", movie: m };
  }
  for (const m of data.rewatch ?? []) {
    if (match(m)) return { status: "rewatch", movie: m };
  }
  return null;
}

export default function MovieWatchlistControls({
  movieId,
  movieTitle,
}: {
  movieId: string;
  movieTitle: string;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<WatchlistStatus | null>(null);
  const [rating, setRating] = useState<number | undefined>();
  const [review, setReview] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      const id = window.setTimeout(() => {
        setLoading(false);
        setStatus(null);
        setRating(undefined);
        setReview(undefined);
      }, 0);
      return () => window.clearTimeout(id);
    }

    if (sessionStatus !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function fetchStatus() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/watchlist");
        if (cancelled) return;
        if (res.status === 401) {
          setStatus(null);
          return;
        }
        if (!res.ok) throw new Error("Could not load watchlist");
        const data = await res.json();
        if (cancelled) return;
        const found = findInList(data, movieId);
        if (found) {
          setStatus(found.status);
          setRating(found.movie.rating);
          setReview(found.movie.review);
        } else {
          setStatus(null);
          setRating(undefined);
          setReview(undefined);
        }
      } catch {
        if (!cancelled) setError("Could not load watchlist status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, movieId]);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setStatus("wantToWatch");
        setToast("Added to your watchlist");
        return;
      }
      if (res.status === 409 && data.category) {
        setStatus(data.category as WatchlistStatus);
        return;
      }
      setError(data.error ?? "Could not add movie.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(next: WatchlistStatus) {
    const prev = status;
    setStatus(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(movieId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setStatus(prev);
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update list.");
        return;
      }
      setToast(`Moved to ${STATUS_LABELS[next]}`);
      if (next === "watched") {
        setReviewOpen(true);
      }
    } catch {
      setStatus(prev);
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveReview(data: { rating: number; review: string }) {
    const res = await fetch(`/api/watchlist/${encodeURIComponent(movieId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to save review");
    }
    setRating(data.rating);
    setReview(data.review);
    setToast("Review saved");
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(movieId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove movie.");
        return;
      }
      setStatus(null);
      setRating(undefined);
      setReview(undefined);
      setRemoveOpen(false);
      setToast("Removed from your watchlist");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sessionStatus === "loading" || loading) {
    return <p className="text-sm text-[#afb6c2]">Checking your watchlist...</p>;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-md border border-[#f5c518]/40 px-4 py-2 text-sm font-semibold text-[#f5c518] hover:bg-[#f5c518]/10 transition-colors"
      >
        Sign in to add to watchlist
      </Link>
    );
  }

  return (
    <div className="space-y-3">
      {status === null ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className="inline-flex items-center rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#d4a713] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
        >
          {busy ? "Adding..." : "Add to Watchlist"}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-[#afb6c2]">In your list:</span>
            <label htmlFor="movie-list-status" className="sr-only">
              Change list
            </label>
            <select
              id="movie-list-status"
              value={status}
              disabled={busy}
              onChange={(e) =>
                void handleStatusChange(e.target.value as WatchlistStatus)
              }
              className="rounded-md bg-[#1a1a1a] border border-[#f5c518]/30 px-3 py-2 text-sm font-semibold text-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518] disabled:opacity-50"
            >
              {(Object.keys(STATUS_LABELS) as WatchlistStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setReviewOpen(true)}
              className="inline-flex items-center rounded-md border border-[#f5c518]/40 px-3 py-2 text-sm font-semibold text-[#f5c518] hover:bg-[#f5c518]/10 transition-colors disabled:opacity-50"
            >
              {rating ? "Edit Review" : "Add Review"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRemoveOpen(true)}
              className="inline-flex items-center rounded-md border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Remove from list
            </button>
          </div>

          {rating != null && (
            <p className="text-xs text-[#afb6c2]">
              <span className="text-[#f5c518] font-semibold">
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)}
              </span>
              {review ? (
                <span className="ml-2 italic line-clamp-2">
                  &ldquo;{review}&rdquo;
                </span>
              ) : null}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <ReviewModal
        isOpen={reviewOpen}
        movieTitle={movieTitle}
        initialRating={rating ?? 5}
        initialReview={review ?? ""}
        onClose={() => setReviewOpen(false)}
        onSubmit={handleSaveReview}
      />

      <ConfirmModal
        isOpen={removeOpen}
        title="Remove from watchlist"
        message={`Remove "${movieTitle}" from your watchlist?`}
        confirmLabel="Remove"
        loadingLabel="Removing..."
        isLoading={busy}
        onConfirm={() => void handleRemove()}
        onCancel={() => setRemoveOpen(false)}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
