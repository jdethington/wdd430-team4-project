import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/authz";
import { findUserById, updateUser } from "@/lib/users";

const PasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

// PATCH /api/account/password update user password
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

  const parsed = PasswordSchema.safeParse(body);
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

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await updateUser(user._id.toString(), {
    hashedPassword,
    status: "active", // clears password_reset
  });

  return NextResponse.json({ success: true, status: "active" });
}
