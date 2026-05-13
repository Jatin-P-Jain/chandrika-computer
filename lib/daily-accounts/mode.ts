import { DailyAccountStatus } from "@/types/daily-account";

export type DailyPageMode = "create" | "view" | "edit";

export function deriveMode(
  status: DailyAccountStatus | undefined,
  modeParam?: string
): DailyPageMode {
  if (!status || status === "draft") return "create";
  return modeParam === "edit" ? "edit" : "view";
}
