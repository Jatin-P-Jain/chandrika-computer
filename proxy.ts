import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/daily-accounts",
  "/photocopy-register",
  "/stamp-register",
  "/attendace-register",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("firebaseAuthToken")?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Missing auth cookie can happen on explicit logout too; avoid false
    // "session expired" states and let client-side inactivity flow set it.
    url.searchParams.delete("sessionExpired");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/daily-accounts/:path*",
    "/photocopy-register/:path*",
    "/stamp-register/:path*",
    "/attendace-register/:path*",
  ],
};
