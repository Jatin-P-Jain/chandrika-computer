const createNextIntlPlugin = require("next-intl/plugin");
import type { NextConfig } from "next";
export const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
