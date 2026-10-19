import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/authz";
import {
  findUserByEmail,
  findUserById,
  softDeleteUser,
  toPublicUser,
  updateUser,
} from "@/lib/users";

const PatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  currentPassword: z.string().min(8),
});

const DeleteSchema = z.object({
  currentPassword: z.string().min(8),
});

// GET /api/account current user account information
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const user = await findUserById(session.user.id);
  if (!user || user.status === "deleted") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}

// PATCH /api/account update user account information
export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const user = await findUserById(session.user.id);
  if (!user?._id || user.status === "deleted") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(
    parsed.data.currentPassword,
    user.hashedPassword,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 },
    );
  }

  const patch: { name?: string; email?: string } = {};
  if (parsed.data.name) patch.name = parsed.data.name;

  if (parsed.data.email) {
    const email = parsed.data.email.toLowerCase();
    if (email !== user.email) {
      const existing = await findUserByEmail(email);
      if (existing && existing._id?.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "Email is already in use." },
          { status: 409 },
        );
      }
      patch.email = email;
    }
  }

  if (!patch.name && !patch.email) {
    return NextResponse.json(
      { error: "No changes provided." },
      { status: 400 },
    );
  }

  const updated = await updateUser(user._id.toString(), patch);
  return NextResponse.json({ user: updated ? toPublicUser(updated) : null });
}

// DELETE /api/account delete user account
export async function DELETE(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Current password is required." },
      { status: 400 },
    );
  }

  const user = await findUserById(session.user.id);
  if (!user?._id || user.status === "deleted") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(
    parsed.data.currentPassword,
    user.hashedPassword,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 },
    );
  }

  await softDeleteUser(user._id.toString(), session.user.id);
  return NextResponse.json({ success: true });
}
