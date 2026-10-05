import { redirect } from "next/navigation";
import { auth } from "@/auth";
import WatchlistManager from "@/components/WatchlistManager";
import {
  getUserWatchlist,
  parseUserId,
  toWatchlistEntryData,
} from "@/lib/watchlist";
import type { WatchlistEntryData } from "@/lib/watchlist";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseUserId(session.user.id);
  if (!userId) {
    redirect("/login");
  }

  let entries: WatchlistEntryData[] = [];
  let loadError = false;

  try {
    entries = (await getUserWatchlist(userId)).map(toWatchlistEntryData);
  } catch (error) {
    console.error("Dashboard watchlist load error:", error);
    loadError = true;
  }

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
            Your WatchList
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#f5f5f4]">
            Welcome, {session.user.name ?? "Movie Fan"}
          </h1>

          <p className="text-[#afb6c2] mt-3">Your personal movie dashboard.</p>
        </div>

        <WatchlistManager initialEntries={entries} initialLoadError={loadError} />
      </div>
    </main>
  );
}
