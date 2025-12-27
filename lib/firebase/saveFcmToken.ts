import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase/client";

export const saveFcmToken = async (
  uid: string,
  token: string,
  metadata: { os: string; browser: string; platform: string },
) => {
  const ref = doc(firestore, "users", uid, "fcmTokens", token);
  await setDoc(ref, {
    token,
    createdAt: new Date().toISOString(),
    ...metadata,
  });
};
