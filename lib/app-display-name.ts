const BASE_APP_NAME = "Chandrika Computer";

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getInstalledAppName() {
  const explicit = normalize(process.env.NEXT_PUBLIC_APP_DISPLAY_ENV);

  if (explicit === "local") return `LOCAL ${BASE_APP_NAME}`;
  if (explicit === "dev") return `DEV ${BASE_APP_NAME}`;
  if (explicit === "prod" || explicit === "production") return BASE_APP_NAME;

  if (process.env.NODE_ENV === "development") {
    return `LOCAL ${BASE_APP_NAME}`;
  }

  const vercelEnv = normalize(process.env.VERCEL_ENV);
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return `DEV ${BASE_APP_NAME}`;
  }

  const publicVercelEnv = normalize(process.env.NEXT_PUBLIC_VERCEL_ENV);
  if (publicVercelEnv === "preview" || publicVercelEnv === "development") {
    return `DEV ${BASE_APP_NAME}`;
  }

  return BASE_APP_NAME;
}
