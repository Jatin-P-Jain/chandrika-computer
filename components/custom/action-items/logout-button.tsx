import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface LogoutButtonProps {
  onLogout: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const tCommon = useTranslations("Common");
  return (
    <Button
      variant="outline"
      onClick={onLogout}
      className="border-red-600 bg-red-600 text-white hover:text-white font-bold dark:border-red-500 dark:bg-red-500 hover:bg-red-600 hover:shadow-md hover:translate-x-0.5 transition-all duration-300"
    >
      <span>{tCommon("Logout")}</span>
      <LogOutIcon />
    </Button>
  );
}
