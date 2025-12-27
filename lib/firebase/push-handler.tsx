"use client";

import { useEffect } from "react";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";
import { app } from "@/firebase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";

export const PushHandler = () => {
  const auth = useAuth();

  useEffect(() => {
    const setup = async () => {
      console.log("sw:", "serviceWorker" in navigator);
      console.log("pushManager:", "PushManager" in window);
      console.log("notifications:", "Notification" in window);
      console.log("notification permission:", Notification.permission);
      console.log("indexedDB:", "indexedDB" in window);
      const supported = await isSupported();
      if (!supported) {
        console.warn("🚫 Messaging not supported");
        return;
      }

      const messaging = getMessaging(app);

      onMessage(messaging, (payload) => {
        console.log("📥 Foreground message received:", payload);

        const title =
          payload.notification?.title ?? payload.data?.title ?? "No title";
        const body =
          payload.notification?.body ?? payload.data?.body ?? "No body";

        if (payload?.data?.uid === auth.clientUser?.uid) {
          // Show toast only if the message is intended for the current user
          toast.success(title, { description: body });
        }
      });
    };

    setup();
  }, []);

  return null;
};
