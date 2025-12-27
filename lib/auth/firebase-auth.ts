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

export const loginWithGoogle = async (): Promise<User | undefined> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
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
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, `+91${mobile}`, verifier);
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
