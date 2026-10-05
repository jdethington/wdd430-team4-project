import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
    deleteUserWatchlistEntry,
    getUserWatchlistEntry,
    parseUserId,
    toWatchlistEntryData,
    updateUserWatchlistEntry,
    WATCHLIST_CATEGORIES,
} from "@/lib/watchlist";
import { ObjectId } from "mongodb";

const UpdateEntrySchema = z
    .object({
        category: z.enum(WATCHLIST_CATEGORIES).optional(),
        rating: z.number().int().min(1).max(5).nullable().optional(),
        review: z.string().max(2000).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

type RouteContext = { params: Promise<{ itemId: string }> };

async function getRequestIdentity(context: RouteContext) {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    const { itemId } = await context.params;

    if (!userId) {
        return { response: NextResponse.json({ error: "Please sign in to access your watchlist." }, { status: 401 }) };
    }

    if (!ObjectId.isValid(itemId)) {
        return { response: NextResponse.json({ error: "Watchlist entry not found." }, { status: 404 }) };
    }

    return { userId, itemId: new ObjectId(itemId) };
}

export async function GET(_request: Request, context: RouteContext) {
    const identity = await getRequestIdentity(context);

    if (identity.response) {
        return identity.response;
    }

    try {
        const entry = await getUserWatchlistEntry(identity.userId, identity.itemId);

        if (!entry) {
            return NextResponse.json({ error: "Watchlist entry not found." }, { status: 404 });
        }

        return NextResponse.json({ entry: toWatchlistEntryData(entry) });
    } catch (error) {
        console.error("Watchlist entry read error:", error);
        return NextResponse.json({ error: "Unable to load this movie." }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    const identity = await getRequestIdentity(context);

    if (identity.response) {
        return identity.response;
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = UpdateEntrySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Check the category, rating, or review and try again.", issues: parsed.error.flatten().fieldErrors },
            { status: 400 },
        );
    }

    try {
        const entry = await updateUserWatchlistEntry(
            identity.userId,
            identity.itemId,
            parsed.data,
        );

        if (!entry) {
            return NextResponse.json({ error: "Watchlist entry not found." }, { status: 404 });
        }

        return NextResponse.json({ entry: toWatchlistEntryData(entry) });
    } catch (error) {
        console.error("Watchlist update error:", error);
        return NextResponse.json({ error: "Unable to update this movie." }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const identity = await getRequestIdentity(context);

    if (identity.response) {
        return identity.response;
    }

    try {
        const deleted = await deleteUserWatchlistEntry(identity.userId, identity.itemId);

        if (!deleted) {
            return NextResponse.json({ error: "Watchlist entry not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Watchlist delete error:", error);
        return NextResponse.json({ error: "Unable to remove this movie." }, { status: 500 });
    }
}