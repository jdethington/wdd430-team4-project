import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { backdropUrl, getTmdbMovieDetails, posterUrl } from "@/lib/tmdb";
import { getOrCreateMovieRecord, optionsForCountry } from "@/lib/movies";

type PageProps = {
  params: Promise<{ id: string }>;
};

const DEFAULT_COUNTRY = "us"; // TODO: detect country from request headers or user profile

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const movie = await getTmdbMovieDetails(decodeURIComponent(id));
  if (!movie) return { title: "Movie not found | WatchList" };
  return {
    title: `${movie.title}${movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ""} | WatchList`,
    description: movie.overview ?? undefined,
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const ref = decodeURIComponent(id);

  // Mongo + MotN (global) when missing or stale
  const record = await getOrCreateMovieRecord(ref);

  // Display metadata always from TMDB
  const details = await getTmdbMovieDetails(ref);
  if (!details && !record) notFound();

  const title = details?.title ?? record?.title ?? "Untitled";
  const year = details?.release_date
    ? Number(details.release_date.slice(0, 4))
    : null;
  const overview = details?.overview || "No description available.";
  const genres =
    details?.genres
      ?.map((g) => g.name)
      .filter(Boolean)
      .join(", ") ?? "";
  const directors =
    details?.credits?.crew
      ?.filter((c) => c.job === "Director")
      .map((c) => c.name)
      .join(", ") ?? "";
  const cast =
    details?.credits?.cast
      ?.slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 12)
      .map((c) => c.name) ?? [];
  const runtime =
    details?.runtime && details.runtime > 0 ? details.runtime : null;
  const rating =
    details?.vote_average != null
      ? Math.round(details.vote_average * 10)
      : null;

  const backdrop = backdropUrl(details?.backdrop_path, "w1280");
  const poster = posterUrl(details?.poster_path, "w500");

  const country = DEFAULT_COUNTRY;
  const streamingOptions = optionsForCountry(record, country);

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
            <section className="pt-4">
              <h2 className="text-sm font-semibold text-[#f5c518] uppercase tracking-wider mb-3">
                Where to watch
              </h2>
              {streamingOptions.length === 0 ? (
                <p className="text-sm text-[#afb6c2]">
                  No streaming options found for this title in{" "}
                  {country.toUpperCase()}.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {streamingOptions.map((opt, i) => (
                    <li key={`${opt.serviceId}-${opt.type}-${i}`}>
                      {opt.link ? (
                        <a
                          href={opt.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-[#f5c518]/30 bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f4] hover:border-[#f5c518]/60 hover:bg-[#f5c518]/10 transition-colors"
                        >
                          <span className="font-semibold text-[#f5c518]">
                            {opt.serviceName}
                          </span>
                          <span className="text-[#afb6c2] text-xs capitalize">
                            {opt.type}
                            {opt.quality ? ` · ${opt.quality}` : ""}
                          </span>
                        </a>
                      ) : (
                        <span className="inline-flex rounded-md border border-[#2c2c2c] px-3 py-2 text-sm text-[#afb6c2]">
                          {opt.serviceName} ({opt.type})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

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
