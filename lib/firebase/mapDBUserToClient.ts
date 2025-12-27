import { UserData, UserRole } from "@/types/user";

export function mapDbUserToClientUser(
  dbUser: FirebaseFirestore.DocumentData | undefined,
): UserData {
  return {
    uid: dbUser?.uid,
    role: (dbUser?.role as UserRole) || null,
    email: dbUser?.email || null,
    phone: dbUser?.phone || null,
    displayName: dbUser?.displayName || null,
    firmName: dbUser?.firmName || undefined,
    photoUrl: dbUser?.photoUrl || null,
    profileComplete: dbUser?.profileComplete ?? false,
    firebaseAuth: dbUser?.firebaseAuth || undefined,
  };
}
