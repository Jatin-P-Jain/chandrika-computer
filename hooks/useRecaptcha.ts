import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

export function useRecaptcha() {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;

    if (window.recaptchaVerifier) {
      setVerifier(window.recaptchaVerifier);
      initialized.current = true;
      return;
    }

    initialized.current = true;
    let attempts = 0;
    const maxAttempts = 100;

    const interval = setInterval(() => {
      attempts += 1;
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          initialized.current = false;
          console.warn("reCAPTCHA container not found in time");
        }
        return;
      }

      clearInterval(interval);

      try {
        const verifierInstance = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {},
          }
        );

        verifierInstance
          .render()
          .then(() => {
            setVerifier(verifierInstance);
            window.recaptchaVerifier = verifierInstance;
          })
          .catch((e) => {
            initialized.current = false;
            console.error("Failed to render reCAPTCHA", e);
          });
      } catch (e) {
        initialized.current = false;
        console.error("Failed to initialize reCAPTCHA", e);
      }
    }, 100); // poll until container is in DOM

    return () => clearInterval(interval);
  }, []);

  return verifier;
}
