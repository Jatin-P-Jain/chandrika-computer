import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserData } from "@/types/user";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DAILY_ACCOUNTS_LIST_PAGE_SIZE =
  Number(process.env.DAILY_ACCOUNTS_LIST_PAGE_SIZE) || 10;

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

export const toDocId = (date = new Date()) => {
  return (
    date.getFullYear().toString() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getDate().toString().padStart(2, "0")
  );
};

export const formatTime = (secs: number) => {
  const min = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const sec = (secs % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
};

export function sumAmounts(items?: { amount?: number }[]) {
  return (items ?? []).reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
}

export function formatINR(value: number, prefix = true, suffix = true) {
  const n = Number(value) || 0;
  if (prefix === false && suffix === false) {
    return new Intl.NumberFormat("en-IN").format(n);
  }
  if (prefix === false) {
    return `${new Intl.NumberFormat("en-IN").format(n)}/-`;
  }
  if (suffix === false) {
    return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
  }
  return `₹${new Intl.NumberFormat("en-IN").format(n)}/-`;
}

export function parseINR(input: string) {
  const cleaned = input
    .replaceAll("₹", "")
    .replaceAll("/-", "")
    .replaceAll(",", "")
    .trim();

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizePhrase(phrase: string): string {
  const strParts = phrase.split(" ");
  const capitalizedParts = strParts.map((part) => capitalize(part));
  return capitalizedParts.join(" ");
}
