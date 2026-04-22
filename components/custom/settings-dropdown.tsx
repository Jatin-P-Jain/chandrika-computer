"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
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
  const { textLabelCls } = useLocaleTypography();

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
            <KeyboardSwitch labelClassName={textLabelCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0 mb-2"
            onSelect={(e) => e.preventDefault()}
          >
            <ThemeModeToggle labelClassName={textLabelCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0"
            onSelect={(e) => e.preventDefault()}
          >
            <LocaleToggle labelClassName={textLabelCls} />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
