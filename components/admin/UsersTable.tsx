"use client";

import { useCallback, useEffect, useState } from "react";
import EditUserModal from "@/components/admin/EditUserModal";
import ConfirmModal from "@/components/ConfirmModal";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: string;
  createdAt: string;
};

type PendingAction =
  | { type: "reset"; user: PublicUser }
  | { type: "delete"; user: PublicUser }
  | null;

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/15 text-green-300 border-green-500/30",
    password_reset: "bg-[#f5c518]/15 text-[#f5c518] border-[#f5c518]/30",
    inactive: "bg-[#afb6c2]/15 text-[#afb6c2] border-[#afb6c2]/30",
    banned: "bg-red-500/15 text-red-300 border-red-500/30",
    deleted: "bg-red-900/30 text-red-400 border-red-500/20",
  };
  const className =
    styles[status] ?? "bg-[#2c2c2c] text-[#afb6c2] border-[#afb6c2]/20";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function UserActions({
  user,
  isLastAdmin,
  onEdit,
  onReset,
  onDelete,
}: {
  user: PublicUser;
  isLastAdmin: boolean;
  onEdit: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const deleteBlocked = user.role === "admin" && isLastAdmin;

  return (
    <>
      <button
        type="button"
        className="text-sm text-[#f5c518] hover:underline"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="text-sm text-[#afb6c2] hover:underline"
        onClick={onReset}
      >
        Reset password
      </button>
      <button
        type="button"
        className="text-sm text-red-400 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        disabled={deleteBlocked}
        title={deleteBlocked ? "Cannot delete the last admin" : undefined}
        onClick={onDelete}
      >
        Delete
      </button>
    </>
  );
}

export default function UsersTable() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PublicUser | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adminCount = users.filter(
    (u) => u.role === "admin" && u.status !== "deleted",
  ).length;
  const isSoleAdminContext = adminCount <= 1;

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (includeDeleted) params.set("includeDeleted", "1");
        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Failed to load users");
        setUsers(data.users ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, includeDeleted, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  async function runPendingAction() {
    if (!pending) return;
    setActionLoading(true);
    try {
      if (pending.type === "reset") {
        const res = await fetch(
          `/api/admin/users/${pending.user.id}/reset-password`,
          { method: "POST" },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Reset password failed");
          return;
        }
        setToast(`Password reset required for ${pending.user.name}.`);
      } else {
        const res = await fetch(`/api/admin/users/${pending.user.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Delete failed");
          return;
        }
        setToast(`${pending.user.name} was soft-deleted.`);
      }
      setPending(null);
      refresh();
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          role="status"
        >
          {toast}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email..."
          className="flex-1 rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/40"
          aria-label="Search users by name or email"
        />
        <label className="flex items-center gap-2 text-sm text-[#afb6c2]">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="rounded border-[#f5c518]/30"
          />
          Include deleted
        </label>
        <button
          type="button"
          onClick={refresh}
          className="w-full sm:w-auto rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#d4a713] transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-md border border-[#f5c518]/10 bg-[#2c2c2c]"
            />
          ))}
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
      {!loading && !error && users.length === 0 && (
        <div className="rounded-md border border-[#f5c518]/20 bg-[#2c2c2c] px-6 py-10 text-center">
          <p className="text-[#f5f5f4] font-medium">No users found</p>
          <p className="text-sm text-[#afb6c2] mt-1">
            {debouncedQ
              ? "Try a different search term or clear the filter."
              : "There are no users to display yet."}
          </p>
        </div>
      )}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <article
                key={u.id}
                className="rounded-md border border-[#f5c518]/20 bg-[#2c2c2c] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-[#f5f5f4]">{u.name}</p>
                    <p className="text-sm text-[#afb6c2] break-all">
                      {u.email}
                    </p>
                    <p className="text-xs text-[#afb6c2] mt-1">
                      Joined {formatDate(u.createdAt)}
                    </p>
                  </div>
                  <span
                    className={
                      u.role === "admin"
                        ? "text-[#f5c518] text-xs font-medium shrink-0"
                        : "text-[#afb6c2] text-xs shrink-0"
                    }
                  >
                    {u.role}
                  </span>
                </div>

                <StatusBadge status={u.status} />

                <div className="flex flex-wrap gap-3 pt-2 border-t border-[#f5c518]/10">
                  <UserActions
                    user={u}
                    isLastAdmin={isSoleAdminContext}
                    onEdit={() => setEditing(u)}
                    onReset={() => setPending({ type: "reset", user: u })}
                    onDelete={() => setPending({ type: "delete", user: u })}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-md border border-[#f5c518]/20">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#2c2c2c] text-[#afb6c2]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-[#2c2c2c] odd:bg-[#1a1a1a] even:bg-[#242424] hover:bg-[#2c2c2c]/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-[#f5f5f4]">{u.name}</td>
                    <td className="px-4 py-3 text-[#afb6c2]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.role === "admin"
                            ? "text-[#f5c518] font-medium"
                            : "text-[#afb6c2]"
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-[#afb6c2]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <UserActions
                          user={u}
                          isLastAdmin={isSoleAdminContext}
                          onEdit={() => setEditing(u)}
                          onReset={() => setPending({ type: "reset", user: u })}
                          onDelete={() =>
                            setPending({ type: "delete", user: u })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {editing && (
        <EditUserModal
          user={editing}
          isLastAdmin={
            editing.role === "admin" &&
            users.filter((u) => u.role === "admin" && u.status !== "deleted")
              .length <= 1
          }
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setToast(`Updated ${editing.name}.`);
            refresh();
          }}
        />
      )}
      <ConfirmModal
        isOpen={pending?.type === "reset"}
        title="Reset password"
        message={
          pending
            ? `Require ${pending.user.name} to set a new password on next login?`
            : ""
        }
        confirmLabel="Reset password"
        loadingLabel="Resetting..."
        isLoading={actionLoading}
        onConfirm={() => void runPendingAction()}
        onCancel={() => setPending(null)}
      />
      <ConfirmModal
        isOpen={pending?.type === "delete"}
        title="Delete user"
        message={
          pending
            ? `Soft-delete ${pending.user.name}? They will not be able to sign in.`
            : ""
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading={actionLoading}
        onConfirm={() => void runPendingAction()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
