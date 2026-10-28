"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./ui/LogoutButton";

function navLinkClass(active: boolean) {
  return [
    "text-sm font-medium transition-colors text-center",
    active ? "text-[#f5c518]" : "text-[#afb6c2] hover:text-[#f5c518]",
  ].join(" ");
}

export default function NavbarClient({
  isLoggedIn,
  isAdmin,
  userName = "",
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = isLoggedIn ? (
    <>
      {userName ? (
        <span className="hidden md:inline text-sm text-[#afb6c2] max-w-[10rem] truncate">
          {userName}
        </span>
      ) : null}
      <Link
        href="/dashboard"
        className={navLinkClass(pathname.startsWith("/dashboard"))}
        onClick={() => setOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        href="/account"
        className={navLinkClass(pathname.startsWith("/account"))}
        onClick={() => setOpen(false)}
      >
        Account
      </Link>
      {isAdmin && (
        <Link
          href="/admin/users"
          className={navLinkClass(pathname.startsWith("/admin"))}
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      )}
      <LogoutButton />
    </>
  ) : (
    <Link
      href="/login"
      className={navLinkClass(
        pathname.startsWith("/login") || pathname.startsWith("/signup"),
      )}
      onClick={() => setOpen(false)}
    >
      Sign In
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#2c2c2c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-serif text-2xl md:text-3xl font-bold tracking-widest text-[#f5f5f4] group-hover:text-[#f5c518] transition-colors">
            WATCH<span className="text-[#f5c518]">LIST</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">{links}</nav>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#afb6c2] hover:text-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t border-[#2c2c2c] bg-[#1a1a1a] px-4 py-4 flex flex-col items-center gap-4"
        >
          {isLoggedIn && userName ? (
            <span className="text-sm text-[#afb6c2]">{userName}</span>
          ) : null}
          {links}
        </nav>
      )}

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#f5c518]/30 to-transparent" />
    </header>
  );
}
