"use client";

import { useCallback, useEffect, useState } from "react";
import EditUserModal from "@/components/admin/EditUserModal";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: string;
  createdAt: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PublicUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (includeDeleted) params.set("includeDeleted", "1");
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [q, includeDeleted]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  async function resetPassword(id: string) {
    if (!confirm("Require this user to set a new password on next login?"))
      return;
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
    });
    if (res.ok) void load();
  }

  async function removeUser(id: string) {
    if (!confirm("Soft-delete this user? They will not be able to sign in."))
      return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) void load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email..."
          className="flex-1 rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
        />
        <label className="flex items-center gap-2 text-sm text-[#afb6c2]">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Include deleted
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#1a1a1a]"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-[#afb6c2]">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-md border border-[#f5c518]/20">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#2c2c2c] text-[#afb6c2]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#2c2c2c]">
                  <td className="px-4 py-3 text-[#f5f5f4]">{u.name}</td>
                  <td className="px-4 py-3 text-[#afb6c2]">{u.email}</td>
                  <td className="px-4 py-3 text-[#f5c518]">{u.role}</td>
                  <td className="px-4 py-3 text-[#afb6c2]">{u.status}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-[#f5c518] hover:underline"
                      onClick={() => setEditing(u)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-[#afb6c2] hover:underline"
                      onClick={() => void resetPassword(u.id)}
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      className="text-red-400 hover:underline"
                      onClick={() => void removeUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
