"use client";
import { useTheme } from "next-themes";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ThemeModeToggle() {
  const tCommon = useTranslations("Common");
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      className="w-fit mx-auto"
      aria-label="Toggle theme"
      onClick={() => {
        theme === "dark" ? setTheme("light") : setTheme("dark");
      }}
    >
      {theme === "dark" ? (
        <div className=" ">
          {/* Use Sun icon for light theme */}
          <WbSunnyRoundedIcon className="size-4" />{" "}
          <span className="text-sm">{tCommon("LightMode")}</span>
        </div>
      ) : (
        <div className="">
          <DarkModeRoundedIcon className="size-4" />{" "}
          <span className="text-sm">{tCommon("DarkMode")}</span>
        </div>
      )}
    </Button>
  );
}
