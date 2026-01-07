"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { ThemeModeToggle } from "./action-items/theme-mode-button";
import { LocaleToggle } from "./action-items/locale-toggle";
import { useLocale, useTranslations } from "next-intl";
import { KeyboardSwitch } from "./action-items/keyboard-switch";
import clsx from "clsx";

export function Preferences() {
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHiCls = clsx(isHi && "text-base! font-medium");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Open settings"
          className="text-primary shadow-sm flex items-center gap-2"
        >
          <span className="md:block hidden">{tCommon("Settings")}</span>
          <Settings2 className="size-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-70 md:w-80">
        <DropdownMenuLabel className="text-base">
          {tCommon("Settings")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center justify-between hover:bg-transparent!"
          onSelect={(e) => e.preventDefault()}
        >
          <KeyboardSwitch labelClassName={textHiCls} />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center justify-between hover:bg-transparent!"
          onSelect={(e) => e.preventDefault()}
        >
          <ThemeModeToggle labelClassName={textHiCls} />
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center justify-between hover:bg-transparent!"
          onSelect={(e) => e.preventDefault()}
        >
          <LocaleToggle labelClassName={textHiCls} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Preferences;
