"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  onDismiss,
  duration = 3000,
}: {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] rounded-md border border-green-500/40 bg-[#1a1a1a] px-4 py-3 text-sm text-green-300 shadow-lg"
      role="status"
    >
      {message}
    </div>
  );
}
