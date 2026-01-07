"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { useKeyboard } from "@/context/keyboard-context";

export function KeyboardSwitch({ labelClassName }: { labelClassName: string }) {
  const tCommon = useTranslations("Common");
  const { isHindiActive, toggleHindiKeyboard } = useKeyboard();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className={labelClassName}>{tCommon("HindiKeyboard")}:</span>
      <Switch
        className="cursor-pointer"
        id="theme-mode"
        checked={isHindiActive}
        aria-label="Toggle dark mode"
        onCheckedChange={toggleHindiKeyboard}
      />
    </div>
  );
}
