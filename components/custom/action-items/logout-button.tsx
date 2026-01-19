import { Button } from "@/components/ui/button";
import { LogOutIcon, Power } from "lucide-react";
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
      size={"sm"}
      className="flex items-center! text-red-600 border-red-600 hover:bg-transparent hover:text-red-600 font-bold dark:border-red-500 dark:bg-red-500 hover:shadow-md hover:translate-x-0.5 transition-all duration-300"
    >
      <span className="hidden md:flex">{tCommon("Logout")}</span>
      <LogOutIcon className="hidden md:flex size-4" />
      <Power className="flex md:hidden size-4 font-semibold" />
    </Button>
  );
}
