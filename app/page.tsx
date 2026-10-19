import { auth } from "@/auth";
import MovieCard, { type Movie } from "@/components/MovieCard";
import Button from "@/components/ui/Button";

async function getPreviewMovies(): Promise<{ movies: Movie[]; error: string | null }> {
  try {
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    const movies = await db
      .collection("movies")
      .aggregate([{ $sample: { size: 3 } }])
      .toArray();

    const sanitizedMovies = movies.map((movie) => ({
      id:
        typeof movie.id === "string" && movie.id.length > 0
          ? movie.id
          : movie._id.toString(),
      _id: movie._id.toString(),
      title: movie.title ?? "Untitled",
      releaseYear: movie.releaseYear ?? null,
      description:
        movie.overview ??
        movie.description ??
        movie.summary ??
        "No description available.",
      genre: Array.isArray(movie.genres)
        ? movie.genres
            .map((g: { name?: string }) => g.name)
            .filter(Boolean)
            .join(", ")
        : (movie.genre ?? ""),
      posterUrl: movie.imageSet?.verticalPoster?.w240 ?? null,
    }));

    return { movies: sanitizedMovies, error: null };
  } catch (error) {
    console.error("Home preview movies error:", error);
    return { movies: [], error: "Unable to load preview movies right now." };
  }
}

export default async function Home() {
  const session = await auth();
  const { movies: previewMovies, error: previewError } = await getPreviewMovies();

  return (
    <main className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle Decorative Geometric Divider */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-[1px] w-12 bg-[#f5c518]" />
          <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
            Cinema Collection Manager
          </span>
          <div className="h-[1px] w-12 bg-[#f5c518]" />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-[#f5f5f4] tracking-wider mb-6">
          Organize & Track Your <br className="hidden sm:inline" />
          <span className="text-[#f5c518]">Movie Journey</span>
        </h1>

        <p className="text-lg md:text-xl text-[#afb6c2] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Replace scattered notes with a private, organized record of films you
          want to watch, films you have watched, and films you want to watch
          again.
        </p>

        {session?.user ? (
          <div className="flex justify-center">
            <Button
              href="/dashboard"
              variant="primary"
              className="w-full sm:w-auto text-base py-4 px-8"
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="/signup"
              variant="primary"
              className="w-full sm:w-auto text-base py-4 px-8"
            >
              Create Free Account
            </Button>
            <Button
              href="/login"
              variant="secondary"
              className="w-full sm:w-auto text-base py-4 px-8"
            >
              Sign In to Dashboard
            </Button>
          </div>
        )}
      </section>

      {/* Feature Preview Section */}
      <section className="py-16 bg-[#2c2c2c]/30 border-y border-[#2c2c2c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#f5f5f4] mb-3">
              Your Personal Vault - Preview
            </h2>
            <p className="text-[#afb6c2] max-w-xl mx-auto text-sm">
              Keep your watchlist organized across three core categories.
            </p>
          </div>

          {previewError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 text-center">
              <p className="text-red-400 text-sm">{previewError}</p>
            </div>
          ) : previewMovies.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#f5c518]/20 rounded-sm p-8 text-center">
              <p className="text-[#f5f5f4] text-base font-semibold mb-2">
                No preview movies available yet.
              </p>
              <p className="text-[#afb6c2] text-sm">
                Check back soon as our catalog grows.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {previewMovies.map((movie) => (
                <MovieCard key={movie.id || movie._id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
