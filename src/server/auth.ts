import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { query } from "./db";
import type { Account } from "@/contract/schemas";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "KareGhar",
      credentials: {
        username: { type: "text" },
        password: { type: "password" },
      },
      async authorize(input) {
        const username = input?.username?.trim();
        if (
          !username ||
          username.length > 40 ||
          !input?.password ||
          input.password.length > 128
        )
          return null;
        const now = Date.now();
        const [limit] = await query<{ attempts: number }>(
          `INSERT INTO login_limits VALUES ($1,1,$2) ON CONFLICT(username) DO UPDATE SET
        attempts=CASE WHEN login_limits.started<$3 THEN 1 ELSE login_limits.attempts+1 END,
        started=CASE WHEN login_limits.started<$3 THEN $2 ELSE login_limits.started END RETURNING attempts`,
          [username, now, now - 900000],
        );
        if (limit.attempts > 12) return null;
        const [user] = await query<Account & { password_hash: string }>(
          "SELECT * FROM account_state WHERE username=$1 AND sample=0 AND suspended=0",
          [username],
        );
        if (!user || !(await verify(user.password_hash, input.password)))
          return null;
        await query("DELETE FROM login_limits WHERE username=$1", [username]);
        return { id: user.id, name: user.name, revision: user.session_version };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user)
        token.revision = (user as typeof user & { revision: number }).revision;
      return token;
    },
    async session({ session, token }) {
      if (token.sub)
        Object.assign(session, {
          accountId: token.sub,
          revision: token.revision,
        });
      return session;
    },
  },
};
export async function viewer(): Promise<Account | null> {
  const session = (await getServerSession(authOptions)) as {
    accountId?: string;
    revision?: number;
  } | null;
  if (!session?.accountId || typeof session.revision !== "number") return null;
  return (
    (
      await query<Account>(
        "SELECT id,name,email,username,effective_role AS role,company,links,photo,revision,sample,session_version FROM account_state WHERE id=$1 AND session_version=$2 AND suspended=0",
        [session.accountId, session.revision],
      )
    )[0] ?? null
  );
}
