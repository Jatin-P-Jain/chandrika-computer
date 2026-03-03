"use client";

import { useRouter } from "nextjs-toploader/app";
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
      ? ""
      : "text-sm px-2 py-1.5 md:px-3 md:py-2 md:text-base font-semibold items-center justify-center min-h-0 h-fit dark:bg-white! dark:text-black! hover:shadow-md hover:translate-x-0 transition-all duration-300 translate-x-0.5"
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
      variant={signingIn ? "ghost" : variant}
    >
      {signingIn ? (
        <div className="flex flex-col items-center justify-center">
          <Image
            src={GoogleLoadingIcon}
            alt=""
            className="-mt-4"
            width={60}
            height={20}
          />
        </div>
      ) : (
        <>
          <div className="hidden md:flex gap-2 items-center justify-center ">
            <Image src={GoogleIcon} alt="" className="size-5" />
            <span className="text-sm">{tSignIn("SignInWithGoogle")}</span>
            <LogInIcon className="size-5" />
          </div>
          <div className="flex md:hidden gap-1 items-center justify-center ">
            <Image src={GoogleIcon} alt="" className="size-5" />
            <span className="text-sm">{tSignIn("SignInWithGoogleMobile")}</span>
            <LogInIcon className="size-5" />
          </div>
        </>
      )}
    </Button>
  );
}
