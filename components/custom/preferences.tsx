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
import { useTranslations } from "next-intl";

export function Preferences() {
  const tCommon = useTranslations("Common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Open settings"
          className="text-primary shadow-sm"
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
          className="flex items-center justify-between"
          onSelect={(e) => e.preventDefault()}
        >
          <ThemeModeToggle />
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center justify-between"
          onSelect={(e) => e.preventDefault()}
        >
          <LocaleToggle />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Preferences;
