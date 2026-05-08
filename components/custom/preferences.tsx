"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { ThemeModeToggle } from "./action-items/theme-mode-button";
import { LocaleToggle } from "./action-items/locale-toggle";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { KeyboardSwitch } from "./action-items/keyboard-switch";

export function Preferences() {
  const tCommon = useTranslations("Common");
  const { textLabelCls } = useLocaleTypography();

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
        <DropdownMenuLabel className="text-lg">
          {tCommon("Settings")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <KeyboardSwitch labelClassName={textLabelCls} />
        </div>
        <div className="px-2 py-1.5">
          <ThemeModeToggle labelClassName={textLabelCls} />
        </div>

        <div className="px-2 py-1.5">
          <LocaleToggle labelClassName={textLabelCls} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Preferences;
