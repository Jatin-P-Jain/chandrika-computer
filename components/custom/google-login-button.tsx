"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/useAuth";
import GoogleIcon from "@/assets/google-icon.svg";
import GoogleLoadingIcon from "@/assets/google-loading.gif";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogInIcon } from "lucide-react";
type ButtonProps = {
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  className?: string;
  onSuccess?: () => void;
  isLogin?: boolean;
};

export default function GoogleLoginButton({
  variant,
  className,
  onSuccess,
}: ButtonProps) {
  const tSignIn = useTranslations("Common");
  const auth = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const combinedClassName = `flex ${
    signingIn
      ? "bg-transparent border-0 shadow-none items-center "
      : "bg-white border shadow-sm text-base font-semibold items-center p-5"
  } ${className ? className : ""}`;
  return (
    <Button
      onClick={async () => {
        setSigningIn(true);
        try {
          await auth?.loginWithGoogle();
          if (onSuccess) {
            onSuccess();
            setSigningIn(false);
          } else {
            router.refresh();
            setSigningIn(false);
          }
        } catch (e) {
          setSigningIn(false);
          console.log({ e });
        }
      }}
      className={`${combinedClassName}`}
      variant={variant}
    >
      {signingIn ? (
        <div className="flex flex-col items-center justify-center">
          <Image
            src={GoogleLoadingIcon}
            alt=""
            className="relative bg-transparent"
            width={80}
            height={50}
          />
          <span className="-mt-6">{tSignIn("SigningInWithGoogle")}...</span>
          {/* <span className="font-medium italic text-sm">
            ({tSignIn("ContinueOnTheTab")})
          </span> */}
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <Image src={GoogleIcon} alt="" className="size-6" />
          <span className="">{tSignIn("SignInWithGoogle")}</span>
          <LogInIcon className="size-5" />
        </div>
      )}
    </Button>
  );
}
