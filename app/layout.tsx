import type { Metadata } from "next";
import {
  Baloo_2,
  Halant,
  Inter,
  Laila,
  Martel,
  Poppins,
} from "next/font/google";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/custom/sections/navbar";
import { LanguageFontWrapper } from "@/components/custom/wrappers/language-font-wrapper";
import { AuthProvider } from "@/context/useAuth";
import { Toaster } from "sonner";

const laila = Laila({
  variable: "--font-laila",
  weight: ["300", "400", "500", "600", "700"],
});
const baloo = Baloo_2({
  variable: "--font-baloo",
  weight: ["400", "500", "600", "700", "800"],
});
const martel = Martel({
  variable: "--font-martel",
  weight: ["200", "300", "400", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const inter = Inter({
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const halant = Halant({
  variable: "--font-halant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${halant.variable} ${inter.variable} ${baloo.variable} ${poppins.variable} ${laila.variable} antialiased bg-muted-foreground/10`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LanguageFontWrapper>
              <AuthProvider>
                <Navbar />
                {children}
                <Toaster
                  richColors
                  className="flex justify-center"
                  toastOptions={{
                    classNames: {
                      toast: "w-fit! flex items-center gap-3",
                      title: "text-lg font-semibold w-full",
                      description: "text-base",
                    },
                  }}
                />
              </AuthProvider>
            </LanguageFontWrapper>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
