"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function ProfileForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  //   const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ name, email, currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }
      await update(); // Keep the session up to date with the new name/email
      setMessage("Profile updated.");
      // setCurrentPassword("");
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
      <label className="block text-sm text-[#afb6c2]">
        Name
        <input
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm text-[#afb6c2]">
        Email
        <input
          type="email"
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {/* <label className="block text-sm text-[#afb6c2]">
        Current password
        <input
          type="password"
          className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          minLength={8}
        />
      </label> */}
      {/* {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-[#f5c518]">{message}</p>} */}
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
