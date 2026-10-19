import Image from "next/image";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";

type MovieDocument = {
  _id: ObjectId;
  id?: string;
  imdbId?: string;
  tmdbId?: string;
  title?: string;
  releaseYear?: number;
  runtime?: number;
  rating?: number;
  overview?: string;
  description?: string;
  summary?: string;
  genre?: string;
  genres?: Array<{ name?: string } | string>;
  directors?: string[];
  cast?: string[];
  imageSet?: {
    verticalPoster?: {
      w720?: string;
      w600?: string;
      w480?: string;
      w360?: string;
      w240?: string;
    };
    horizontalBackdrop?: {
      w1440?: string;
      w1080?: string;
      w720?: string;
      w480?: string;
      w360?: string;
    };
  };
};

function firstString(...values: Array<string | undefined | null>) {
  return values.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

async function findMovieById(id: string): Promise<MovieDocument | null> {
  const db = await getDb();
  const filters: Record<string, unknown>[] = [
    { id },
    { imdbId: id },
    { tmdbId: id },
  ];

  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }

  return db.collection<MovieDocument>("movies").findOne({ $or: filters });
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await findMovieById(id);

  if (!movie) {
    notFound();
  }

  const title = movie.title ?? "Untitled";
  const year = movie.releaseYear ?? null;
  const runtime = movie.runtime ?? null;
  const rating = movie.rating ?? null;
  const overview =
    movie.overview ?? movie.description ?? movie.summary ?? "No overview yet.";
  const genres = Array.isArray(movie.genres)
    ? movie.genres
        .map((genre) => (typeof genre === "string" ? genre : genre.name))
        .filter((genre): genre is string => Boolean(genre))
    : movie.genre
      ? [movie.genre]
      : [];
  const directors = Array.isArray(movie.directors) ? movie.directors : [];
  const cast = Array.isArray(movie.cast) ? movie.cast : [];
  const posterUrl = firstString(
    movie.imageSet?.verticalPoster?.w720,
    movie.imageSet?.verticalPoster?.w600,
    movie.imageSet?.verticalPoster?.w480,
    movie.imageSet?.verticalPoster?.w360,
    movie.imageSet?.verticalPoster?.w240,
  );
  const backdropUrl = firstString(
    movie.imageSet?.horizontalBackdrop?.w1440,
    movie.imageSet?.horizontalBackdrop?.w1080,
    movie.imageSet?.horizontalBackdrop?.w720,
    movie.imageSet?.horizontalBackdrop?.w480,
    movie.imageSet?.horizontalBackdrop?.w360,
  );

  return (
    <main className="min-h-[80vh] px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-sm border border-[#f5c518]/20 bg-[#2c2c2c] min-h-[240px]">
          {backdropUrl ? (
            <>
              <Image
                src={backdropUrl}
                alt={`${title} backdrop`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/70 to-[#1a1a1a]/30" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] to-[#2c2c2c]" />
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
          <div>
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={`${title} poster`}
                width={220}
                height={330}
                className="w-full max-w-[220px] rounded-sm border border-[#f5c518]/20"
              />
            ) : (
              <div className="w-full max-w-[220px] aspect-[2/3] rounded-sm border border-[#f5c518]/20 bg-[#2c2c2c] flex items-center justify-center text-[#afb6c2] text-xs">
                Poster unavailable
              </div>
            )}
          </div>

          <article className="space-y-5">
            <div>
              <h1 className="font-serif text-4xl font-bold text-[#f5f5f4]">
                {title}
              </h1>
              <p className="mt-2 text-[#afb6c2] text-sm">
                {[year ? String(year) : null, runtime ? `${runtime} min` : null]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#f5c518] uppercase tracking-wider text-xs font-semibold mb-1">
                  Genres
                </p>
                <p className="text-[#f5f5f4]">
                  {genres.length > 0 ? genres.join(", ") : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[#f5c518] uppercase tracking-wider text-xs font-semibold mb-1">
                  Rating
                </p>
                <p className="text-[#f5f5f4]">
                  {rating !== null ? `${rating}/100` : "Not rated"}
                </p>
              </div>
              <div>
                <p className="text-[#f5c518] uppercase tracking-wider text-xs font-semibold mb-1">
                  Directors
                </p>
                <p className="text-[#f5f5f4]">
                  {directors.length > 0
                    ? directors.join(", ")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[#f5c518] uppercase tracking-wider text-xs font-semibold mb-1">
                  Cast
                </p>
                <p className="text-[#f5f5f4]">
                  {cast.length > 0 ? cast.join(", ") : "Not specified"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[#f5c518] uppercase tracking-wider text-xs font-semibold mb-2">
                Overview
              </p>
              <p className="text-[#afb6c2] leading-relaxed">{overview}</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
