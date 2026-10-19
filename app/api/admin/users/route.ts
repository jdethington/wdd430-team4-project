import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { listUsers } from "@/lib/users";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const includeDeleted = searchParams.get("includeDeleted") === "1";
  const limit = Number(searchParams.get("limit") ?? "50");
  const skip = Number(searchParams.get("skip") ?? "0");

  const result = await listUsers({ q, includeDeleted, limit, skip });
  return NextResponse.json(result);
}
