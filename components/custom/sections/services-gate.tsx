"use client";

import Link from "next/link";
import { ClipboardListIcon, Info, Layers, LogInIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ServicesGate() {
  const tHomePage = useTranslations("HomePage");
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampStockLedger = useTranslations("StampStock");
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
          <Button asChild className="">
            <Link
              href="/login"
              className="md:w-fit w-full flex items-center gap-2 font-semibold! text-[16px]!"
            >
              <span className="">{tCommon("Login")}</span>
              <LogInIcon />
            </Link>
          </Button>
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
