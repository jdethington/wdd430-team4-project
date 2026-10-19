import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!session || session.user.role !== "admin") return null;
  return session;
}
