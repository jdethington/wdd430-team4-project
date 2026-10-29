"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function PasswordForm({
  onPasswordUpdated,
}: {
  onPasswordUpdated?: () => void;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not update password.");
        return;
      }

      await update(); // Refresh JWT so status becomes "active" for middleware
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      onPasswordUpdated?.();
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && (
        <div
          className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          role="status"
        >
          {message}
        </div>
      )}
      {error && (
        <div
          className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
      <label
        htmlFor="password-current"
        className="block text-sm text-[#afb6c2]"
      >
        Current password
        <input
          id="password-current"
          type="password"
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/40"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="current-password"
        />
      </label>
      <label htmlFor="password-new" className="block text-sm text-[#afb6c2]">
        New password
        <input
          id="password-new"
          type="password"
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/40"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label
        htmlFor="password-confirm"
        className="block text-sm text-[#afb6c2]"
      >
        Confirm new password
        <input
          id="password-confirm"
          type="password"
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/40"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
