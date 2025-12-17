"use client";
import { useTheme } from "next-themes";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeModeToggle() {
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
          <span className="text-[10px]">Light Mode</span>
        </div>
      ) : (
        <div className="">
          <DarkModeRoundedIcon className="size-4" />{" "}
          <span className="text-[10px]">Dark Mode</span>
        </div>
      )}
    </Button>
  );
}
