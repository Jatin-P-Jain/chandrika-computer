import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
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

export const loginWithGoogle = async (): Promise<User | undefined> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!isGoogleEmailAllowlisted(user.email)) {
    await auth.signOut();
    await removeToken();
    throw new GoogleEmailNotAllowedError(user.email);
  }

  const token = await user.getIdToken(true);
  await setToken(token, user.refreshToken);
  return user;
};

export const loginWithEmailAndPass = async (
  email: string,
  password: string
): Promise<User | undefined> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const token = await user.getIdToken(true);
  await setToken(token, user.refreshToken);
  return user;
};

export const sendOTP = async (
  mobile: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult | null> => {
  try {
    return await signInWithPhoneNumber(auth, `+91${mobile}`, verifier);
  } catch (error) {
    console.log("Error in signInWithPhoneNumber", error);
    return null;
  }
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
      const token = await user.getIdToken(true);
      await setToken(token, user.refreshToken);
      sessionStorage.setItem(`phone_verified:${user.uid}`, "1");
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
  sessionStorage.setItem(`phone_verified:${auth.currentUser?.uid}`, "0");
  await auth.signOut();
  await removeToken();
};
