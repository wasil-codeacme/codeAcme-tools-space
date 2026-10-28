import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { HTTP_STATUS } from '@/lib/http-status';
import { MESSAGES } from '@/lib/messages';
import { PUBLIC_PATHS, ROUTES } from '@/lib/routes';
import { verifySession } from '@/lib/session';

const API_PREFIX = '/api/';

// Navigation-level check only: a valid signature gets through, everything else is sent to sign in.
// Pages, actions and route handlers re-check the live user, which is the real security boundary.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === ROUTES.AUTH.LOGIN) {
    return session ? NextResponse.redirect(new URL(ROUTES.HOME, request.url)) : NextResponse.next();
  }
  if (session || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.json(
      { error: MESSAGES.AUTH.SESSION_EXPIRED },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
}

export const config = {
  // Icons and link-preview images must load for crawlers and signed-out visitors.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|brand/).*)',
  ],
};
