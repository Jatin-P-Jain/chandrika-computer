type FirestoreMetricBase = {
  source: "server" | "client";
  operation: string;
  collection?: string;
};

type FirestoreMetricPayload = FirestoreMetricBase & {
  durationMs: number;
  success: boolean;
  docsRead?: number;
  docsWritten?: number;
  details?: Record<string, unknown>;
  error?: string;
};

const isLoggingEnabled =
  process.env.FIRESTORE_DEBUG === "1" ||
  process.env.NEXT_PUBLIC_FIRESTORE_DEBUG === "1" ||
  process.env.NODE_ENV !== "production";

function nowMs() {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

function logFirestoreMetric(payload: FirestoreMetricPayload) {
  if (!isLoggingEnabled) return;

  const level = payload.success ? "debug" : "warn";
  const safePayload = {
    source: payload.source,
    operation: payload.operation,
    collection: payload.collection,
    durationMs: Number(payload.durationMs.toFixed(2)),
    success: payload.success,
    docsRead: payload.docsRead,
    docsWritten: payload.docsWritten,
    details: payload.details,
    error: payload.error,
  };

  console[level]("[firestore-metric]", safePayload);
}

export function startFirestoreMetric(base: FirestoreMetricBase) {
  const startedAt = nowMs();

  return (
    extra: Omit<
      FirestoreMetricPayload,
      keyof FirestoreMetricBase | "durationMs"
    >
  ) => {
    const durationMs = nowMs() - startedAt;
    logFirestoreMetric({
      ...base,
      durationMs,
      ...extra,
    });
  };
}
