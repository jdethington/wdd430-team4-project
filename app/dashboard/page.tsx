import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardClient from "@/components/DashboardClient";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
            Your WatchList
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#f5f5f4]">
            Welcome, {session?.user?.name ?? "Movie Fan"}
          </h1>

          <p className="text-[#afb6c2] mt-3">Your personal movie dashboard.</p>
        </div>

        <DashboardClient />
      </div>
    </main>
  );
}
