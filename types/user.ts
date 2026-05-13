export type UserRole = "admin" | "user";

export type UserMini = {
  displayName?: string | null;
  phoneNumber?: string | null;
  photoUrl?: string | null;
};
export type UserData = {
  uid: string;
  role: UserRole | string | null;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoUrl?: string | null;
  phoneVerified?: boolean;
};
