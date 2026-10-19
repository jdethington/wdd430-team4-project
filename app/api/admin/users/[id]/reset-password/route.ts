import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { findUserById, toPublicUser, updateUser } from "@/lib/users";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const user = await findUserById(id);
  if (!user?._id || user.status === "deleted") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await updateUser(user._id.toString(), {
    status: "password_reset",
  });

  return NextResponse.json({ user: updated ? toPublicUser(updated) : null });
}
