import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("CHANDRIKA_COMPUTER_LOCALE");
  const locale = cookieLocale?.value || "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
