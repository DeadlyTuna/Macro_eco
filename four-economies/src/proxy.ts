import { NextResponse, type NextRequest } from "next/server";

// With Partial Prefetching the country page streams its shell before the slug is
// checked, so an unknown slug would render the not-found page with a 200. Answer
// those requests with a real 404 before rendering starts.
const SLUGS = new Set(["bosnia-and-herzegovina", "seychelles", "viet-nam", "maldives"]);

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !SLUGS.has(slug)) {
    return NextResponse.rewrite(new URL("/not-a-country", request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/countries/:slug*",
};
