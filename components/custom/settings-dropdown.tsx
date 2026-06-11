"use client";

import { Download, Loader2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { usePwaPrompt } from "@/hooks/usePwaPrompt";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeModeToggle } from "./action-items/theme-mode-button";
import { LocaleToggle } from "./action-items/locale-toggle";
import { KeyboardSwitch } from "./action-items/keyboard-switch";

export function SettingsDropdown() {
  const tCommon = useTranslations("Common");
  const { textLabelCls } = useLocaleTypography();
  const { canInstall, isPwa, promptToInstall, diagnostics } = usePwaPrompt();
  const [isInstalling, setIsInstalling] = useState(false);

  const onInstall = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    if (!canInstall) {
      if (diagnostics.isAndroidChrome) {
        toast.message(tCommon("InstallFromBrowserMenu"));
      } else {
        toast.message(tCommon("InstallNotAvailable"));
      }
      setIsInstalling(false);
      return;
    }

    try {
      const outcome = await promptToInstall();
      if (outcome === "accepted") {
        toast.success(tCommon("InstallAccepted"));
      } else if (outcome === "dismissed") {
        toast.message(tCommon("InstallDismissed"));
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Settings className="size-6 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-3 gap-3 flex flex-col">
        <div className="flex flex-col gap-1">
          <DropdownMenuLabel className="font-medium text-muted-foreground p-0 mb-2">
            {tCommon("Settings")}
          </DropdownMenuLabel>

          <div className="mb-2">
            <KeyboardSwitch labelClassName={textLabelCls} />
          </div>

          <div className="mb-2">
            <ThemeModeToggle labelClassName={textLabelCls} />
          </div>

          <div>
            <LocaleToggle labelClassName={textLabelCls} />
          </div>

          {!isPwa ? (
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-center gap-1 "
                onClick={onInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {tCommon("InstallApp")}
              </Button>
            </div>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
