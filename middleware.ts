import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { buildCSPHeader } from '@/lib/security';

export function middleware(_req: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', buildCSPHeader());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
