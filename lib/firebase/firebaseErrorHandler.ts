// lib/firebaseErrorHandler.ts
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";

export function handleFirebaseAuthError(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-verification-code":
        toast.error("Invalid OTP. Please try again.");
        break;
      case "auth/code-expired":
        toast.error("OTP expired. Please request a new one.");
        break;
      case "auth/missing-verification-code":
        toast.error("Please enter the OTP code.");
        break;
      case "auth/invalid-verification-id":
        toast.error("Session expired. Please resend the OTP.");
        break;
      case "auth/credential-already-in-use":
        toast.error("This phone number is already in use.");
        break;
      case "auth/account-exists-with-different-credential":
        toast.error(
          "This number is linked to an account with a different method.",
        );
        break;
      case "auth/too-many-requests":
        toast.error("Too many attempts. Try again later.");
        break;
      case "auth/invalid-app-credential":
      case "auth/missing-app-credential":
        toast.error("Security verification failed. Please refresh the page.");
        break;
      case "auth/network-request-failed":
        toast.error("Network error. Check your connection.");
        break;
      default:
        toast.error("Failed to verify phone number. Please try again.");
        console.error("Unhandled Firebase auth error:", error);
    }
  } else {
    toast.error("Something went wrong. Please try again.");
    console.error("Unknown error:", error);
  }
}
