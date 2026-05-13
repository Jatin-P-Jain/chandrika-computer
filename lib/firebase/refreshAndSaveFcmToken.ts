import { getMessaging, getToken } from "firebase/messaging";
import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/lib/firebase/saveFcmToken";

export async function refreshAndSaveFcmToken(userUid: string) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const serviceWorkerRegistration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));

    const messaging = getMessaging();
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
