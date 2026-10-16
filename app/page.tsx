import { auth } from "@/auth";
import Button from "@/components/ui/Button";
import MovieCard, { Movie } from "@/components/MovieCard";
import { getDb } from "@/lib/db";

async function getPreviewMovies(limit = 3): Promise<Movie[]> {
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
  const previewMovies = await getPreviewMovies(3);

  // Temporary preview movies for unauthenticated visitors
  const sampleMovies = [
    {
      id: 1,
      title: "The Fellowship of the Ring",
      year: "2001",
      category: "Want to Watch",
      rating: null,
      summary:
        "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.",
    },
    {
      id: 2,
      title: "Star Wars: Episode IV - A New Hope",
      year: "1977",
      category: "Watched",
      rating: "★ 5/5",
      summary:
        "A farmboy joins forces with various allies to save their galaxy from the evil Empire’s planet-destroying battle station, while also rescuing the princess leading the rebellion against them.",
    },
    {
      id: 3,
      title: "The Scarlet Pimpernel",
      year: "1982",
      category: "Want to Rewatch",
      rating: "★ 5/5",
      summary:
        "Paris, 1792: After France becomes a republic, aristocrats are guillotined. The English Sir Percy tries to save as many as he can as The Scarlet Pimpernel in disguises.",
    },
  ];

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

        {/* Auth CTAs — only for guests */}
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

          {/* Sample Movie Cards */}
          {previewMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {previewMovies.map((movie) => (
                <MovieCard key={movie.id ?? movie._id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[#afb6c2] text-sm">
              Preview movies will appear here once the catalog is available.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
