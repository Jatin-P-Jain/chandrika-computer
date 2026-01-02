import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserData } from "@/types/user";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDeviceMetadata = () => {
  const ua = navigator.userAgent;

  const getPlatform = (): string => {
    // Fallback for older browsers
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS/i.test(ua)) return "macOS";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Android/i.test(ua)) return "Android";
    if (/Linux/i.test(ua)) return "Linux";

    return "Unknown";
  };
  const platform = getPlatform();

  let os = "Unknown";
  if (/android/i.test(ua)) os = "Android";
  else if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";

  const browserMatch = ua.match(
    /(firefox|msie|chrome|safari|trident(?=\/))\/?\s*(\d+)/i
  );
  const browser = browserMatch ? browserMatch[1] : "Unknown";

  return { os, browser, platform };
};

type UserLike = Partial<UserData> | null | undefined;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const pickStr = (...vals: Array<unknown>) =>
  vals.map(str).find((s) => s.trim().length > 0) ?? "";

export function buildUser(
  clientUser: UserLike,
  currentUser: FirebaseUser | null | undefined
): UserData {
  console.log({ clientUser, currentUser });

  return {
    uid: pickStr(clientUser?.uid, currentUser?.uid),
    phoneNumber: pickStr(clientUser?.phoneNumber, currentUser?.phoneNumber),
    displayName: pickStr(clientUser?.displayName, currentUser?.displayName),
    photoUrl: pickStr(clientUser?.photoUrl, currentUser?.photoURL),
    email: pickStr(clientUser?.email, currentUser?.email),

    // Keep these aligned to your actual UserData type:
    role: clientUser?.role ?? null,
  };
}
