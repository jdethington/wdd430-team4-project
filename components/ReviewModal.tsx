"use client";

import { useState } from "react";

interface ReviewModalProps {
  movieTitle: string;
  initialRating?: number;
  initialReview?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; review: string }) => Promise<void>;
}

export default function ReviewModal({
  movieTitle,
  initialRating = 5,
  initialReview = "",
  isOpen,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [review, setReview] = useState<string>(initialReview);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ rating, review });
      onClose();
    } catch {
      setError("Failed to save review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#2c2c2c] border border-[#f5c518]/30 rounded-lg p-6 max-w-md w-full shadow-2xl text-[#f5f5f4]">
        <div className="flex justify-between items-start mb-4">
          <h2
            id="review-modal-title"
            className="font-serif text-xl font-bold text-[#f5c518]"
          >
            Review & Rating
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#afb6c2] hover:text-[#f5f5f4] text-xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-[#afb6c2] mb-4">
          Sharing your thoughts on: <strong className="text-[#f5f5f4]">{movieTitle}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="rating-select"
              className="block text-sm font-semibold mb-1"
            >
              Rating (1 - 5 Stars)
            </label>
            <select
              id="rating-select"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-[#f5c518]/30 rounded px-3 py-2 text-[#f5f5f4] focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
            >
              <option value={5}>5 ★★★★★ (Masterpiece)</option>
              <option value={4}>4 ★★★★☆ (Great)</option>
              <option value={3}>3 ★★★☆☆ (Good)</option>
              <option value={2}>2 ★★☆☆☆ (Fair)</option>
              <option value={1}>1 ★☆☆☆☆ (Poor)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="review-notes"
              className="block text-sm font-semibold mb-1"
            >
              Review Notes
            </label>
            <textarea
              id="review-notes"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think of the film?"
              className="w-full bg-[#1a1a1a] border border-[#f5c518]/30 rounded px-3 py-2 text-[#f5f5f4] placeholder-[#afb6c2]/60 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          {error && (
            <p className="text-xs text-[#e50914]" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded bg-[#1a1a1a] text-[#afb6c2] hover:text-[#f5f5f4] border border-[#afb6c2]/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold rounded bg-[#f5c518] text-[#1a1a1a] hover:bg-[#f5c518]/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}