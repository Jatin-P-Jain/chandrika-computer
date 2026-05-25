import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPhoneNumber,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  ConfirmationResult,
  User,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { removeToken, setToken } from "@/context/actions";

export const GOOGLE_EMAIL_DENIED_ERROR_CODE = "auth/email-not-allowed";

export class GoogleEmailNotAllowedError extends Error {
  code = GOOGLE_EMAIL_DENIED_ERROR_CODE;

  constructor(public readonly email: string | null) {
    super("Google account is not allowlisted");
    this.name = "GoogleEmailNotAllowedError";
  }
}

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

export const isGoogleEmailAllowlisted = (email: string | null): boolean => {
  if (!email) return false;
  if (ALLOWED_GOOGLE_EMAILS.size === 0) return false;
  return ALLOWED_GOOGLE_EMAILS.has(email.trim().toLowerCase());
};

function isMobileOrStandalone() {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & { standalone?: boolean };
  const isStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true;
  const isMobileUA = /android|iphone|ipad|ipod|mobile/i.test(
    navigator.userAgent
  );

  return isStandaloneMode || isMobileUA;
}

async function finalizeGoogleUser(user: User) {
  if (!isGoogleEmailAllowlisted(user.email)) {
    await auth.signOut();
    await removeToken();
    throw new GoogleEmailNotAllowedError(user.email);
  }

  const token = await user.getIdToken();
  await setToken(token, user.refreshToken);
  return user;
}

export const loginWithGoogle = async (): Promise<User | undefined> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (isMobileOrStandalone()) {
    await signInWithRedirect(auth, provider);
    return undefined;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return await finalizeGoogleUser(result.user);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/operation-not-supported-in-this-environment")
    ) {
      await signInWithRedirect(auth, provider);
      return undefined;
    }
    throw error;
  }
};

export const completeGoogleRedirectLogin = async (): Promise<
  User | undefined
> => {
  const result = await getRedirectResult(auth);
  if (!result?.user) return undefined;
  return finalizeGoogleUser(result.user);
};

export const loginWithGoogleIdToken = async (
  idToken: string
): Promise<User | undefined> => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;

  if (!isGoogleEmailAllowlisted(user.email)) {
    await auth.signOut();
    await removeToken();
    throw new GoogleEmailNotAllowedError(user.email);
  }

  const token = await user.getIdToken();
  await setToken(token, user.refreshToken);
  return user;
};

export const loginWithEmailAndPass = async (
  email: string,
  password: string
): Promise<User | undefined> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const token = await user.getIdToken();
  await setToken(token, user.refreshToken);
  return user;
};

export const sendOTP = async (
  mobile: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return signInWithPhoneNumber(auth, `+91${mobile}`, verifier);
};

export const verifyOTP = async (
  otp: string,
  confirmationResult: ConfirmationResult
): Promise<User | undefined> => {
  try {
    const result = await confirmationResult.confirm(otp);
    if (result) {
      // console.log("OTP verification successful", result);
      const user = result.user;
      const token = await user.getIdToken();
      await setToken(token, user.refreshToken);
      return user;
    } else {
      console.log("OTP verification failed: No result returned");
    }
  } catch (err) {
    console.log("OTP verification failed", err);
    throw err;
  }
};

export const logoutUser = async () => {
  await auth.signOut();
  await removeToken();
};
