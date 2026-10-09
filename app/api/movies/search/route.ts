import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // add an escape function for regex search  
    const escapeRegex = (text: string) =>
      text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const movies = await db
      .collection("movies")
      .find({
        title: { $regex: escapeRegex(query), $options: "i" },
      })
      .limit(20)
      .toArray();

    const sanitizedMovies = movies.map((movie) => ({
      _id: movie._id.toString(),
      title: movie.title ?? "Untitled",
      releaseYear: movie.releaseYear ?? null,
      description:
        movie.overview ??
        movie.description ??
        movie.summary ??
        "No description available.",
      genre: Array.isArray(movie.genres)
        ? movie.genres.map((g: { name?: string }) => g.name).filter(Boolean).join(", ")
        : movie.genre ?? "",
      // imageSet: movie.imageSet ?? null,
      posterUrl: movie.imageSet?.verticalPoster?.w240 ?? null,
    }));

    return NextResponse.json({ movies: sanitizedMovies }, { status: 200 });
  } catch (error) {
    console.error("Movie search error:", error);
    return NextResponse.json(
      { error: "Failed to search movies. Please try again." },
      { status: 500 }
    );
  }
}