"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not delete account.");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#afb6c2]">
        Delete your account. You will not be able to sign in afterward.
      </p>
      {!open ? (
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      ) : (
        <div className="space-y-3 border border-red-500/30 rounded-md p-4">
          <label className="block text-sm text-[#afb6c2]">
            Confirm with current password
            <input
              type="password"
              className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-red-500/30 px-3 py-2 text-[#f5f5f4]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              minLength={8}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Confirm delete"}
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
