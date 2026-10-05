import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { movies } from "@/lib/watchlist-db";

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Sign in to search movies." }, { status: 401 });
    }

    const query = new URL(request.url).searchParams.get("q")?.trim();

    if (!query) {
        return NextResponse.json({ error: "Enter a movie title to search." }, { status: 400 });
    }

    const normalizedQuery = query.toLocaleLowerCase();
    const results = movies
        .filter((movie) =>
            [movie.title, movie.originalTitle, movie.overview].some((value) =>
                value.toLocaleLowerCase().includes(normalizedQuery),
            ),
        )
        .slice(0, 30)
        .map((movie) => ({
            id: movie.id,
            title: movie.title,
            year: String(movie.releaseYear),
            summary: movie.overview,
            posterUrl: movie.imageSet?.verticalPoster?.w360,
        }));

    return NextResponse.json({ results });
}