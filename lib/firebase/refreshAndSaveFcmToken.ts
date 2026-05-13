import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/firebase/client";
import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/lib/firebase/saveFcmToken";

export async function refreshAndSaveFcmToken(userUid: string) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    // Avoid noisy runtime failures on deployments where Firebase web config
    // is partially missing (e.g. appId not set for that environment).
    if (!app.options.appId || !app.options.projectId || !app.options.apiKey) {
      console.warn(
        "Skipping FCM token refresh: Firebase app config incomplete"
      );
      return;
    }

    const serviceWorkerRegistration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });
    if (!token) return;

    const metadata = getDeviceMetadata();
    await saveFcmToken(userUid, token, metadata);
    console.log("✅ FCM token refreshed & saved:", token);
  } catch (error) {
    console.error("Failed to refresh and save FCM token", error);
  }
}
