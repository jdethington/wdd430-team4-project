// app/api/watchlist/[movieId]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { WatchlistDocument } from '@/lib/watchlist';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ movieId: string }> }
) {
    // check authentication
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    const userId = session.user.id;
    const { movieId } = await params;

    if (!movieId) {
        return NextResponse.json(
            { error: 'movieId is required' },
            { status: 400 }
        );
    }

    try {
        const db = await getDb();

        // find the user's watchlist document
        const watchlistDoc = await db
            .collection('watchlist')
            .findOne({ userId });

        if (!watchlistDoc) {
            return NextResponse.json(
                { error: 'Watchlist not found' },
                { status: 404 }
            );
        }

        // check which array the movie is in
        const inWantToWatch = watchlistDoc.wantToWatch?.includes(movieId);
        const inWatched = watchlistDoc.watched?.includes(movieId);
        const inRewatch = watchlistDoc.rewatch?.includes(movieId);

        if (!inWantToWatch && !inWatched && !inRewatch) {
            return NextResponse.json(
                { error: 'Movie not found in watchlist' },
                { status: 404 }
            );
        }

        // remove from whichever array contains it using $pull
        await db.collection<WatchlistDocument>('watchlist').updateOne(
            { userId },
            {
                $pull: {
                    wantToWatch: movieId,
                    watched: movieId,
                    rewatch: movieId,
                },
            }
        );

        return NextResponse.json(
            { message: 'Movie removed from watchlist' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to remove movie from watchlist' },
            { status: 500 }
        );
    }
}