// app/api/movies/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mapTmdbSearchToMovieResponse, searchTmdbMovies } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const data = await searchTmdbMovies(q);
    const movies = (data.results ?? [])
      .slice(0, 20)
      .map(mapTmdbSearchToMovieResponse);

    return NextResponse.json({ movies }, { status: 200 });
  } catch (error) {
    console.error("Movie search error:", error);
    return NextResponse.json(
      { error: "Failed to search movies. Please try again." },
      { status: 500 },
    );
  }
}
