"use client";

import Link from "next/link";
import {
  ClipboardListIcon,
  Info,
  Layers,
  Loader2Icon,
  LogOutIcon,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import GoogleLoginButton from "../google-login-button";
import { useAuth } from "@/context/useAuth";

export function ServicesGate() {
  const tHomePage = useTranslations("HomePage");
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampStockLedger = useTranslations("StampStock");

  const auth = useAuth();
  const { clientUser, clientUserLoading, logout, currentUser, isLoggingOut } =
    auth;

  return (
    <section className="flex w-full flex-col mx-auto space-y-3 md:space-y-6 rounded-xl bg-muted p-4 md:p-6 shadow-sm">
      {/* Information block */}
      <Card className="bg-background shadow-none p-2 py-4 gap-2">
        <CardHeader className="w-full flex flex-row items-center gap-4">
          <div className="rounded-full p-2 w-fit bg-primary/10 text-primary">
            <Info className="size-5" />
          </div>
          <CardTitle className="">{tHomePage("SecureServices")}</CardTitle>
        </CardHeader>
        <CardContent className="">
          <CardDescription>{tHomePage("SecureServicesDesc")}</CardDescription>
        </CardContent>
        <CardFooter className="">
          {/* <Button asChild className="">
            <Link
              href="/login"
              className="md:w-fit w-full flex items-center gap-2 font-semibold! text-[16px]!"
            >
              <span className="">{tCommon("Login")}</span>
              <LogInIcon />
            </Link>
          </Button> */}
          {currentUser && clientUserLoading ? (
            <div className="flex items-center justify-center">
              <Loader2Icon className="h-5 w-5 animate-spin" />
            </div>
          ) : clientUser ? (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="text-sm font-medium">
                Welcome{" "}
                {clientUser?.displayName ??
                  currentUser?.displayName ??
                  currentUser?.email ??
                  "User"}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => logout?.()}
                disabled={isLoggingOut}
                className="flex gap-2 justify-center dark:border-red-600 dark:bg-red-100 dark:hover:bg-red-100 border-red-600 bg-red-100 text-red-700 hover:text-red-700 hover:bg-red-100 hover:border-red-600 w-fit hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <span>{tCommon("Logout")}</span>
                {isLoggingOut ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOutIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <GoogleLoginButton variant={"outline"} className="" />
          )}
        </CardFooter>
      </Card>

      {/* Service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/daily-account" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-fit p-4 size-16 items-center justify-center rounded-md bg-indigo-100 text-indigo-900/90 ">
                {/* replace with your own icon */}
                <span className="">
                  <ClipboardListIcon className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <CardTitle className="">{tDailyAccount("Title")}</CardTitle>
                <CardDescription className="text-sm">
                  {tDailyAccount("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/stamp-stock-ledger" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-fit p-4 size-16 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Layers className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="">{tStampStockLedger("Title")}</CardTitle>
                <CardDescription className="text-sm">
                  {tStampStockLedger("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
