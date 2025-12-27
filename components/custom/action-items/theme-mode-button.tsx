"use client";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";

export function ThemeModeToggle() {
  const tCommon = useTranslations("Common");
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="text-sm">{tCommon("DarkMode")}:</span>
      <Switch
        id="theme-mode"
        checked={theme === "dark"}
        aria-label="Toggle dark mode"
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
