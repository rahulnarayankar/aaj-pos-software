import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";
  const isPos = pathname === "/pos" || pathname.startsWith("/pos/");
  const isApi = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/login");

  if ((isPos || isApi) && !session) {
    if (isApi) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((isLogin || pathname === "/") && session) {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/pos", "/pos/:path*", "/api/:path*"],
};
