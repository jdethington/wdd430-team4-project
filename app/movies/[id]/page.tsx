import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findMovieByRef } from "@/lib/movie-ids";
import { ensureMovieInDb } from "@/lib/movies";
// import { getDb } from "@/lib/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getMovie(id: string) {
  // 1. Local DB (imdbId → tmdbId → id)
  let movie = await findMovieByRef(decodeURIComponent(id));

  // 2. If missing, try Streaming Availability + upsert, then re-read
  if (!movie) {
    const ensured = await ensureMovieInDb(decodeURIComponent(id));
    if (ensured) {
      movie = await findMovieByRef(ensured.id);
    }
  }

  return movie;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovie(id);
  if (!movie) return { title: "Movie not found | WatchList" };
  return {
    title: `${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ""} | WatchList`,
    description: movie.overview ?? movie.description ?? undefined,
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovie(id);

  if (!movie) notFound();

  const title = movie.title ?? "Untitled";
  const year = movie.releaseYear ?? null;
  const overview =
    movie.overview ?? movie.description ?? "No description available.";
  const genres = Array.isArray(movie.genres)
    ? movie.genres
        .map((g: { name?: string }) => g.name)
        .filter(Boolean)
        .join(", ")
    : (movie.genre ?? "");
  const directors = Array.isArray(movie.directors)
    ? movie.directors.join(", ")
    : "";
  const cast = Array.isArray(movie.cast) ? movie.cast.slice(0, 12) : [];
  const rating =
    typeof movie.rating === "number" && movie.rating > 0 ? movie.rating : null;
  const runtime =
    typeof movie.runtime === "number" && movie.runtime > 0
      ? movie.runtime
      : null;

  const backdrop =
    movie.imageSet?.horizontalBackdrop?.w1440 ||
    movie.imageSet?.horizontalBackdrop?.w1080 ||
    movie.imageSet?.horizontalBackdrop?.w720 ||
    movie.imageSet?.horizontalBackdrop?.w480 ||
    null;

  const poster =
    movie.imageSet?.verticalPoster?.w480 ||
    movie.imageSet?.verticalPoster?.w360 ||
    movie.imageSet?.verticalPoster?.w240 ||
    null;

  return (
    <main className="min-h-[80vh]">
      {/* Horizontal backdrop hero */}
      <section className="relative w-full min-h-[280px] md:min-h-[420px] bg-[#111]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={`${title} backdrop`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/70 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Vertical poster */}
          <div className="shrink-0 w-40 sm:w-48 md:w-56 mx-auto md:mx-0">
            {poster ? (
              <Image
                src={poster}
                alt={`${title} poster`}
                width={224}
                height={336}
                className="w-full rounded-md border border-[#f5c518]/20 shadow-xl object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-md bg-[#2c2c2c] border border-[#f5c518]/20 flex items-center justify-center text-[#afb6c2] text-sm">
                No poster
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
                Movie
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#f5f5f4] leading-tight">
                {title}
                {year ? (
                  <span className="text-[#afb6c2] font-normal text-2xl sm:text-3xl ml-3">
                    ({year})
                  </span>
                ) : null}
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
              {genres && (
                <span className="text-[#afb6c2] uppercase tracking-wider text-xs font-semibold">
                  {genres}
                </span>
              )}
              {runtime != null && (
                <span className="text-[#afb6c2] text-xs border border-[#f5c518]/20 rounded px-2 py-1">
                  {runtime} min
                </span>
              )}
              {rating != null && (
                <span className="text-[#f5c518] text-xs font-semibold border border-[#f5c518]/30 rounded px-2 py-1">
                  ★ {rating}/100
                </span>
              )}
            </div>

            <p className="text-[#afb6c2] leading-relaxed max-w-3xl mx-auto md:mx-0">
              {overview}
            </p>

            {directors && (
              <p className="text-sm text-[#f5f5f4]">
                <span className="text-[#afb6c2]">Directed by </span>
                {directors}
              </p>
            )}

            {cast.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#f5c518] uppercase tracking-wider mb-2">
                  Cast
                </h2>
                <p className="text-sm text-[#afb6c2]">{cast.join(" · ")}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md border border-[#f5c518]/40 px-4 py-2 text-sm font-semibold text-[#f5c518] hover:bg-[#f5c518]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
