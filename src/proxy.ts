import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const hostname = req.nextUrl.hostname;

  if (hostname === 'studio.flixtrend.in') {
    return NextResponse.rewrite(
      new URL(`/studio${req.nextUrl.pathname}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};