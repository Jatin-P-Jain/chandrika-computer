const DEVICE_ID_KEY = "trusted_device_id";
const TRUSTED_DEVICE_PREFIX = "trusted_device_verified";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function createDeviceId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateDeviceId() {
  if (!canUseStorage()) return null;

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = createDeviceId();
  window.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

function trustedKey(uid: string, deviceId: string) {
  return `${TRUSTED_DEVICE_PREFIX}:${uid}:${deviceId}`;
}

export function isDeviceTrustedLocally(uid: string, deviceId: string) {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(trustedKey(uid, deviceId)) === "1";
}

export function markDeviceTrustedLocally(uid: string, deviceId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(trustedKey(uid, deviceId), "1");
}
