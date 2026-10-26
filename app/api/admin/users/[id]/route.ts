import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import {
  countAdmins,
  findUserByEmail,
  findUserById,
  softDeleteUser,
  toPublicUser,
  updateUser,
  type UserRole,
  type UserStatus,
} from "@/lib/users";

const PatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  confirmRoleChange: z.boolean().optional(),
  status: z.enum(["active", "password_reset", "inactive", "banned"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const user = await findUserById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const user = await findUserById(id);
  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { name, email, role, confirmRoleChange, status } = parsed.data;

  if (role !== undefined && role !== user.role) {
    if (!confirmRoleChange) {
      return NextResponse.json(
        {
          error: "Role change requires confirmation.",
          code: "CONFIRM_ROLE_CHANGE",
        },
        { status: 400 },
      );
    }
    if (user.role === "admin" && role === "user") {
      const admins = await countAdmins();
      if (admins <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin." },
          { status: 400 },
        );
      }
    }
  }

  if (email && email.toLowerCase() !== user.email) {
    const existing = await findUserByEmail(email);
    if (existing && existing._id?.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Email is already in use." },
        { status: 409 },
      );
    }
  }

  const patch: {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
  } = {};
  if (name) patch.name = name;
  if (email) patch.email = email.toLowerCase();
  if (role) patch.role = role;
  if (status) patch.status = status;

  const updated = await updateUser(user._id.toString(), patch);
  return NextResponse.json({ user: updated ? toPublicUser(updated) : null });
}

export async function DELETE(_request: Request, context: Ctx) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from admin." },
      { status: 400 },
    );
  }

  const user = await findUserById(id);
  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin." },
        { status: 400 },
      );
    }
  }

  const updated = await softDeleteUser(user._id.toString(), session.user.id);
  return NextResponse.json({ user: updated ? toPublicUser(updated) : null });
}
