"use client";

import { useSession } from "next-auth/react";

export default function AccountAlerts({
  passwordJustUpdated,
}: {
  passwordJustUpdated: boolean;
}) {
  const { data: session } = useSession();
  const mustReset = session?.user?.status === "password_reset";

  if (passwordJustUpdated) {
    return (
      <div
        className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300"
        role="status"
      >
        Password updated successfully. You can continue using your account.
      </div>
    );
  }

  if (mustReset) {
    return (
      <div
        className="rounded-md border border-[#f5c518]/40 bg-[#f5c518]/10 px-4 py-3 text-sm text-[#f5f5f4]"
        role="alert"
      >
        Your password was reset by an administrator. Please set a new password
        before continuing.
      </div>
    );
  }

  return null;
}
