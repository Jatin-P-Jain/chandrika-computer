"use client";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";

export function ThemeModeToggle({
  labelClassName,
}: {
  labelClassName: string;
}) {
  const tCommon = useTranslations("Common");
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className={labelClassName}>{tCommon("DarkMode")}:</span>
      <Switch
        className="cursor-pointer"
        id="theme-mode"
        checked={theme === "dark"}
        aria-label="Toggle dark mode"
        onCheckedChange={(checked) =>
          startTransition(() => setTheme(checked ? "dark" : "light"))
        }
        disabled={isPending}
      />
    </div>
  );
}
