// i18n/request.ts (or wherever this file is)
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED = new Set(["en", "hi"]);

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(
    "CHANDRIKA_COMPUTER_LOCALE"
  )?.value;

  const locale =
    cookieLocale && SUPPORTED.has(cookieLocale) ? cookieLocale : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
