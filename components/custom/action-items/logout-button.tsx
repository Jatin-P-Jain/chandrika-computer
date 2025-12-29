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
      className="border-red-600 bg-red-600 text-white font-bold"
    >
      <span>{tCommon("Logout")}</span>
      <LogOutIcon />
    </Button>
  );
}
