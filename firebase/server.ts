import { getApps, ServiceAccount } from "firebase-admin/app";
import admin from "firebase-admin";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Auth, getAuth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";
import { getMessaging, Messaging } from "firebase-admin/messaging";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.NEXT_PUBLIC_FIREBASE_SERVER_PROJECT_ID,
  private_key_id: process.env.FIRBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIRBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
};
let messaging: Messaging;
let fireStore: Firestore;
let auth: Auth;
let storage: Storage;
const currentApps = getApps();
if (!currentApps.length) {
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  fireStore = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  messaging = getMessaging(app);
} else {
  const app = currentApps[0];
  fireStore = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  messaging = getMessaging(app);
}

export { fireStore, auth, storage, messaging };

export const getTotalPages = async (
  firestoreQuery: FirebaseFirestore.Query<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >,
  pageSize: number
) => {
  const queryCount = firestoreQuery.count();
  const countSnapshot = await queryCount.get();
  const countData = countSnapshot.data();
  const total = countData.count;
  const totalPages = Math.ceil(total / pageSize);
  return { totalPages, totalItems: total };
};
