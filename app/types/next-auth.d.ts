import "next-auth";
import "next-auth/jwt";
import { UserRole, UserStatus } from "@/lib/users";

// Extend the session type so TypeScript knows session.user.id exists.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      status?: UserStatus;
    };
  }

  interface User {
    role?: UserRole;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: UserStatus;
  }
}
