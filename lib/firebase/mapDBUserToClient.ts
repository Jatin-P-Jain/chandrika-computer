import { UserData, UserRole } from "@/types/user";

export function mapDbUserToClientUser(
  dbUser: FirebaseFirestore.DocumentData | undefined
): UserData {
  return {
    uid: dbUser?.uid,
    role: (dbUser?.role as UserRole) || null,
    email: dbUser?.email || null,
    phoneNumber: dbUser?.phoneNumber || null,
    displayName: dbUser?.displayName || null,
    photoUrl: dbUser?.photoUrl || null,
  };
}
