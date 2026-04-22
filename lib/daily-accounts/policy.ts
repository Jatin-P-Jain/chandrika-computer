import { auth } from "@/firebase/server";
import { UserData } from "@/types/user";

export async function ensureAdminAccess(
  user: UserData | null,
  authtoken: string
) {
  if (!user) {
    return { ok: false as const, message: "Unauthorized" };
  }

  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return { ok: false as const, message: "Unauthorized" };
  }

  return { ok: true as const };
}
