import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

export function useRecaptcha() {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;

    const interval = setInterval(() => {
      const container = document.getElementById("recaptcha-container");
      if (!container) return;

      clearInterval(interval);

      try {
        const verifierInstance = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {},
          },
        );

        verifierInstance.render().then(() => {
          setVerifier(verifierInstance);
          window.recaptchaVerifier = verifierInstance; // Optional global backup
        });
      } catch (e) {
        console.error("Failed to initialize reCAPTCHA", e);
      }
    }, 100); // poll until container is in DOM
  }, []);

  return verifier;
}
