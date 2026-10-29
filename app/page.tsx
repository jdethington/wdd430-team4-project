import { auth } from "@/auth";
import Button from "@/components/ui/Button";
import MovieCard, { Movie } from "@/components/MovieCard";
import { getDb } from "@/lib/db";

const DEMO_SECTIONS = [
  { key: "wantToWatch", label: "Want to Watch" },
  { key: "watched", label: "Watched" },
  { key: "rewatch", label: "Want to Rewatch" },
] as const;

async function getPreviewMovies(limit = 9): Promise<Movie[]> {
  try {
    const db = await getDb();

    const docs = await db
      .collection("movies")
      .aggregate([{ $sample: { size: limit } }])
      .toArray();

    return docs.map((movie) => {
      const id =
        typeof movie.id === "string" && movie.id.length > 0
          ? movie.id
          : movie._id.toString();

      return {
        id,
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
      } satisfies Movie;
    });
  } catch (error) {
    console.error("Failed to load preview movies:", error);
    return [];
  }
}

export default async function Home() {
  const session = await auth();
  const previewMovies = await getPreviewMovies(9);

  return (
    <main className="relative overflow-hidden">
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
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

        {!session?.user ? (
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
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="/dashboard"
              variant="primary"
              className="w-full sm:w-auto text-base py-4 px-8"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </section>

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

          {previewMovies.length > 0 ? (
            <div className="space-y-12">
              {DEMO_SECTIONS.map((section, sectionIndex) => {
                const movies = previewMovies.slice(
                  sectionIndex * 3,
                  sectionIndex * 3 + 3,
                );
                if (movies.length === 0) return null;

                return (
                  <section key={section.key}>
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-bold text-[#f5f5f4]">
                        {section.label}
                      </h3>
                      <span className="text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded font-semibold">
                        {movies.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {movies.map((movie) => (
                        <MovieCard
                          key={movie.id ?? movie._id}
                          movie={movie}
                          status={section.key}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#afb6c2] text-sm">
              Preview movies will appear here once the catalog is available.
            </p>
          )}

          <div className="mt-12 text-center">
            {session?.user ? (
              <Button
                href="/dashboard"
                variant="primary"
                className="text-base py-3 px-8"
              >
                Build your list →
              </Button>
            ) : (
              <Button
                href="/signup"
                variant="primary"
                className="text-base py-3 px-8"
              >
                Build your list →
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
