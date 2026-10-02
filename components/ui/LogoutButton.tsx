"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-medium text-[#afb6c2] hover:text-[#f5c518] transition-colors"
    >
      Log Out
    </button>
  );
}
