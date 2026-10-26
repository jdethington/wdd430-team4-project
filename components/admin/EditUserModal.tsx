"use client";

import { useState } from "react";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: string;
};

export default function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: PublicUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleChanged = role !== user.role;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          status,
          confirmRoleChange: roleChanged ? confirmRoleChange : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-md bg-[#2c2c2c] border border-[#f5c518]/30 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#f5f5f4]">Edit user</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm text-[#afb6c2]">
            Name
            <input
              className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm text-[#afb6c2]">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm text-[#afb6c2]">
            Role
            <select
              className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as "user" | "admin");
                setConfirmRoleChange(false);
              }}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {roleChanged && (
            <label className="flex items-start gap-2 text-sm text-[#f5c518]">
              <input
                type="checkbox"
                checked={confirmRoleChange}
                onChange={(e) => setConfirmRoleChange(e.target.checked)}
              />
              I confirm changing this user&apos;s role from{" "}
              <strong>{user.role}</strong> to <strong>{role}</strong>.
            </label>
          )}
          <label className="block text-sm text-[#afb6c2]">
            Status
            <select
              className="mt-1 w-full rounded-md bg-[#1a1a1a] border border-[#f5c518]/20 px-3 py-2 text-[#f5f5f4]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">active</option>
              <option value="password_reset">password_reset</option>
              <option value="inactive">inactive</option>
              <option value="banned">banned</option>
            </select>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#f5c518]/30 px-4 py-2 text-sm text-[#f5c518]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (roleChanged && !confirmRoleChange)}
              className="rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#1a1a1a] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
