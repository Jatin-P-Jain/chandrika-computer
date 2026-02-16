"use client";

import clsx from "clsx";
import { Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeModeToggle } from "./action-items/theme-mode-button";
import { LocaleToggle } from "./action-items/locale-toggle";
import { KeyboardSwitch } from "./action-items/keyboard-switch";

export function SettingsDropdown() {
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHiCls = clsx(isHi && "text-base! font-medium");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Settings className="size-6 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-3 gap-3 flex flex-col">
        {/* Preferences Section */}
        <div className="flex flex-col gap-1">
          <DropdownMenuLabel className="font-semibold text-muted-foreground p-0 mb-2">
            {tCommon("Settings")}
          </DropdownMenuLabel>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0 mb-2"
            onSelect={(e) => e.preventDefault()}
          >
            <KeyboardSwitch labelClassName={textHiCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0 mb-2"
            onSelect={(e) => e.preventDefault()}
          >
            <ThemeModeToggle labelClassName={textHiCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0"
            onSelect={(e) => e.preventDefault()}
          >
            <LocaleToggle labelClassName={textHiCls} />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
