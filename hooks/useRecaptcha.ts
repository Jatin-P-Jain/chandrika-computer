import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container-global";

const ensureRecaptchaContainer = (): string => {
  let container = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = RECAPTCHA_CONTAINER_ID;
    container.style.display = "none";
    document.body.appendChild(container);
  }
  return RECAPTCHA_CONTAINER_ID;
};

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
    try {
      const containerId = ensureRecaptchaContainer();
      const verifierInstance = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {},
      });

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
  }, []);

  return verifier;
}
