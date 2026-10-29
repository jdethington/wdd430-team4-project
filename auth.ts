import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { canLogin, findUserByEmail, updateUser } from "@/lib/users";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsedCredentials = CredentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = await findUserByEmail(email);

        if (!user || !user._id) {
          return null;
        }

        if (!canLogin(user.status)) return null;

        const passwordsMatch = await bcrypt.compare(
          password,
          user.hashedPassword,
        );

        if (!passwordsMatch) {
          return null;
        }

        await updateUser(user._id.toString(), { lastLoginAt: new Date() });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      // After password change (or any session.update()), re-read from DB
      if (trigger === "update" && token.id) {
        const { findUserById } = await import("@/lib/users");
        const dbUser = await findUserById(token.id as string);
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role;
      if (token.status) session.user.status = token.status;
      if (typeof token.name === "string") session.user.name = token.name;
      if (typeof token.email === "string") session.user.email = token.email;
      return session;
    },
  },
});
