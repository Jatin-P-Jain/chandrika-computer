"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const CardLocaleContext = React.createContext<{ locale: string } | null>(null);

function useCardLocale() {
  const ctx = React.useContext(CardLocaleContext);
  return ctx?.locale ?? "en";
}

function Card({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
          locale === "hi" && "text-base",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-header"
        className={cn(
          "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
          locale === "hi" && "text-xl",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-title"
        className={cn(
          "leading-none font-semibold",
          locale === "hi" && "text-lg",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-description"
        className={cn(
          "text-muted-foreground text-sm",
          locale === "hi" && "text-base",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-action"
        className={cn(
          "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
          locale === "hi" && "text-lg",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-content"
        className={cn("px-6", locale === "hi" && "text-lg", className)}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  const locale = useCardLocale();

  return (
    <CardLocaleContext.Provider value={{ locale }}>
      <div
        data-slot="card-footer"
        className={cn(
          "flex items-center px-6 [.border-t]:pt-6",
          locale === "hi" && "text-lg",
          className
        )}
        {...props}
      />
    </CardLocaleContext.Provider>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
