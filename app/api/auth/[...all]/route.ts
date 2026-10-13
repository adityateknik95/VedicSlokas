import { getAuth } from "@/lib/auth";

// Better Auth's endpoints (Google OAuth start/callback, get-session, sign-out, …).
// Mutating requests are CSRF-checked by Better Auth against trustedOrigins.
async function handler(request: Request): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export { handler as GET, handler as POST };
