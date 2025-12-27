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
  const combinedClassName = `w-1/2 h-1/8 flex mx-auto cursor-pointer shadow-sm text-base font-medium ${
    className ? className : ""
  }`;
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
        <div className="flex flex-col items-center justify-center gap-4">
          <Image
            src={GoogleLoadingIcon}
            alt=""
            className="relative"
            width={80}
            height={50}
          />
          <span className="">{tSignIn("SigningInWithGoogle")}...</span>
          <span className="font-medium italic text-sm">
            ({tSignIn("ContinueOnTheTab")})
          </span>
        </div>
      ) : (
        <div className="flex gap-2 justify-center items-center">
          <Image src={GoogleIcon} alt="" width={25} height={25} />
          <span className="">{tSignIn("SignInWithGoogle")}</span>
          <LogInIcon className="size-5" />
        </div>
      )}
    </Button>
  );
}
