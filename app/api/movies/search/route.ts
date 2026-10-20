// app/api/movies/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchMoviesByTitle } from "@/lib/movies";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 },
      );
    }

    if (!process.env.STREAMING_AVAILABILITY_API_KEY) {
      return NextResponse.json(
        { error: "Movie search is not configured." },
        { status: 503 },
      );
    }

    const movies = await searchMoviesByTitle(query, "us");

    return NextResponse.json({ movies }, { status: 200 });
  } catch (error) {
    console.error("Movie search error:", error);
    return NextResponse.json(
      { error: "Failed to search movies. Please try again." },
      { status: 500 },
    );
  }
}
