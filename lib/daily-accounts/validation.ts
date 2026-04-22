import { dailySchema } from "@/schema/daily-page.schema";
import { DailyAccountInput } from "@/lib/daily-accounts/types";

export function validateDailyAccountInput(data: DailyAccountInput) {
  const validation = dailySchema.safeParse(data);

  if (!validation.success) {
    return {
      ok: false as const,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  return { ok: true as const, data: validation.data };
}
