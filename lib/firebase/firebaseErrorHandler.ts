// lib/firebaseErrorHandler.ts
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";

type ToastTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export function handleFirebaseAuthError(
  error: unknown,
  tToast: ToastTranslator
) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-verification-code":
        toast.error(tToast("InvalidOTP"), {
          description: tToast("InvalidOTPDesc"),
        });
        break;
      case "auth/code-expired":
        toast.error(tToast("OTPExpired"), {
          description: tToast("OTPExpiredDesc"),
        });
        break;
      case "auth/missing-verification-code":
        toast.error(tToast("MissingOTP"), {
          description: tToast("MissingOTPDesc"),
        });
        break;
      case "auth/invalid-verification-id":
        toast.error(tToast("SessionExpired"));
        break;
      case "auth/credential-already-in-use":
        toast.error(tToast("CredentialAlreadyInUse"), {
          description: tToast("CredentialAlreadyInUseDesc"),
        });
        break;
      case "auth/account-exists-with-different-credential":
        toast.error(tToast("AccountExistsWithDifferentCredential"), {
          description: tToast("AccountExistsWithDifferentCredentialDesc"),
        });
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
    toast.error(tToast("SomethingWentWrong"), {
      description: tToast("SomethingWentWrongDesc"),
    });
    console.error("Unknown error:", error);
  }
}
