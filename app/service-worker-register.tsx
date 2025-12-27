"use client";

import { useEffect } from "react";

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          // Unregister any existing service worker first (optional)
          const existingRegistrations =
            await navigator.serviceWorker.getRegistrations();
          for (const registration of existingRegistrations) {
            if (registration.scope === window.location.origin + "/") {
              await registration.unregister();
              console.log("Existing SW unregistered");
            }
          }

          // Register the new service worker
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
              scope: "/",
              updateViaCache: "none", // Always fetch fresh SW
            },
          );

          console.log("SW registered successfully:", registration);

          // Wait for the service worker to be ready
          const swRegistration = await navigator.serviceWorker.ready;
          console.log("SW ready:", swRegistration);

          // Handle service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log("New SW available");
                  // You can show a notification to user to refresh the page
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener("message", (event) => {
            console.log("Message from SW:", event.data);
          });
        } catch (error) {
          console.error("SW registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    } else {
      console.log("Service workers are not supported in this browser");
    }
  }, []);

  return null;
};
