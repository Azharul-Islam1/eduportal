import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check SuperAdmin first (system-level, separate model)
        const superAdmin = await db.superAdmin.findUnique({
          where: { email: credentials.email },
        });

        if (superAdmin) {
          const match = await bcrypt.compare(credentials.password, superAdmin.passwordHash);
          if (!match) return null;
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: "SUPER_ADMIN",
            schoolId: null,
          } as never;
        }

        // Fall back to school-level User
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
            schoolId: true,
          },
        });

        if (!user || !user.isActive) return null;

        const match = await bcrypt.compare(credentials.password, user.password);
        if (!match) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as string,
          schoolId: user.schoolId,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; schoolId: string | null };
        token.id = u.id;
        token.role = u.role;
        token.schoolId = u.schoolId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.schoolId = (token.schoolId as string | null) ?? null;
      return session;
    },
  },
};
