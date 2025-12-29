

export type UserRole =
  | "admin"
  | "guest"

export type UserData = {
  uid: string;
  role: UserRole | string | null;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoUrl?: string | null;
};
