"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/useAuth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import GoogleLoadingIcon from "@/assets/icons/google-loading.gif";
import Image from "next/image";
import { useState } from "react";
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
  isLogin,
}: ButtonProps) {
  const auth = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const combinedClassName = `flex mx-auto rounded-4xl w-[80%] cursor-pointer w-full rounded-lg md:rounded-2xl py-3 md: py-5 shadow-sm text-sm md:text-base font-bold${
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
        <>
          <Image
            src={GoogleLoadingIcon}
            alt=""
            className="relative"
            width={50}
            height={50}
          />
          {isLogin ? "Logging In with Google" : "Continue with Google"}
        </>
      ) : (
        <>
          <>
            <Image
              src={GoogleIcon}
              alt=""
              className="relative"
              width={30}
              height={30}
            />
            {isLogin ? "Login with Google" : "Continue with Google"}
          </>
        </>
      )}
    </Button>
  );
}
