import { auth } from "@/firebase/server";
import { UserData } from "@/types/user";

const ALLOWED_GOOGLE_EMAILS = new Set(
  (
    process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAILS ??
    process.env.NEXT_PUBLIC_ALLOWED_EMAILS ??
    ""
  )
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function isAllowlistedEmail(email: string | null | undefined) {
  if (!email) return false;
  if (ALLOWED_GOOGLE_EMAILS.size === 0) return false;
  return ALLOWED_GOOGLE_EMAILS.has(email.trim().toLowerCase());
}

export async function ensureAdminAccess(
  user: UserData | null,
  authtoken: string
) {
  if (!user) {
    return { ok: false as const, message: "Unauthorized" };
  }

  const verifiedToken = await auth.verifyIdToken(authtoken);

  const allowlisted = isAllowlistedEmail(verifiedToken.email);
  const hasAdminClaim = Boolean(verifiedToken.admin);

  // App policy: all allowlisted emails are admins.
  if (!allowlisted && !hasAdminClaim) {
    return { ok: false as const, message: "Unauthorized" };
  }

  return { ok: true as const };
}
