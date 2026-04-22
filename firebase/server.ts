import { getApps, ServiceAccount } from "firebase-admin/app";
import admin from "firebase-admin";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Auth, getAuth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";

const requiredFirebaseAdminEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "FIREBASE_CLIENT_CERT_URL",
] as const;

const missingFirebaseAdminEnv = requiredFirebaseAdminEnv.filter(
  (key) => !process.env[key]
);

if (missingFirebaseAdminEnv.length > 0) {
  throw new Error(
    `Missing Firebase Admin credentials in environment: ${missingFirebaseAdminEnv.join(
      ", "
    )}`
  );
}

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
};

if (!serviceAccount.private_key?.includes("BEGIN PRIVATE KEY")) {
  throw new Error(
    "Invalid FIREBASE_PRIVATE_KEY format. Ensure the full key is provided and newline characters are escaped as \\n in .env."
  );
}

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
  const done = startFirestoreMetric({
    source: "server",
    operation: "getTotalPages",
    collection: "unknown",
  });

  const queryCount = firestoreQuery.count();
  const countSnapshot = await queryCount.get();
  const countData = countSnapshot.data();
  const total = countData.count;
  const totalPages = Math.ceil(total / pageSize);

  done({ success: true, docsRead: 1, details: { total, pageSize } });

  return { totalPages, totalItems: total };
};
