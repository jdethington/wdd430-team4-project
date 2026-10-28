"use client";

import { useState } from "react";

export default function MovieCast({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  if (names.length === 0) return null;

  const preview = names.slice(0, 4).join(" · ");
  const full = names.join(" · ");

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold text-[#f5c518] uppercase tracking-wider">
          Cast
        </h2>
        {names.length > 4 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-[#afb6c2] hover:text-[#f5c518] transition-colors md:hidden"
          >
            {open ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      {/* Mobile: collapsed preview unless expanded */}
      <p className="text-sm text-[#afb6c2] md:hidden">
        {open || names.length <= 4 ? full : `${preview}…`}
      </p>
      {/* Desktop: always full */}
      <p className="text-sm text-[#afb6c2] hidden md:block">{full}</p>
    </div>
  );
}
