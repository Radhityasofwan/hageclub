import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let user: Awaited<ReturnType<typeof db.user.findUnique<{ include: { profile: true } }>>> | null = null;

        try {
          user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { profile: true },
          });
        } catch (dbErr) {
          console.error("[NextAuth] DB error during authorize:", dbErr);
          throw new Error("SERVER_ERROR");
        }

        if (!user) return null;

        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        } catch (bcryptErr) {
          console.error("[NextAuth] bcrypt error:", bcryptErr);
          throw new Error("SERVER_ERROR");
        }

        if (!isPasswordValid) return null;

        if (user.role === "CUSTOMER" && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const name = user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
          : user.email.split("@")[0];

        return {
          id: user.id,
          email: user.email,
          name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
