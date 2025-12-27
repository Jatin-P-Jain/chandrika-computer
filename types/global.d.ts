export {};

declare global {
  interface Window {
    recaptchaVerifier?: import("firebase/auth").RecaptchaVerifier;
  }
}
