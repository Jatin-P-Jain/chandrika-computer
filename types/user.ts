export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type UserRole =
  | "admin"
  | "retailer"
  | "wholesaler"
  | "distributor"
  | "other";

export type UserData = {
  uid: string;
  role: UserRole | string | null;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  firmName?: string;
  photoUrl?: string | null;
  profileComplete?: boolean;
  firebaseAuth?: FirebaseAuthData;
};
