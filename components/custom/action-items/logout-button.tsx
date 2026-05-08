import { Button } from "@/components/ui/button";
import { Loader2, LogOutIcon, Power } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface LogoutButtonProps {
  onLogout: () => void | Promise<void>;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const tCommon = useTranslations("Common");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoggingOut}
      size={"sm"}
      className="flex items-center! text-red-600 border-red-600 hover:bg-transparent hover:text-red-600 font-bold dark:border-red-500 dark:bg-red-500 hover:shadow-md hover:translate-x-0.5 transition-all duration-300"
    >
      <span className="hidden md:flex">{tCommon("Logout")}</span>
      {isLoggingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <LogOutIcon className="hidden md:flex size-4" />
          <Power className="flex md:hidden size-4 font-semibold" />
        </>
      )}
    </Button>
  );
}
