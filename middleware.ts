import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './app/lib/helpers';

const API_ENDPOINTS = [
  '/api/ranking',
  '/api/main-data',
  '/api/main-posts',
  '/api/events',
  '/api/subjects',
  '/api/primitive-subjects',
  '/api/files',
  '/api/messages',
  '/api/user',
  '/api/users',
];

export async function middleware(request: NextRequest) {
  try {
    const verification = await verifySession();
    const sessionError = verification.error;
    const hasSession = !sessionError; // User is authenticated if no session error

    // Redirect authenticated users away from login/register
    if (hasSession && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register') || request.nextUrl.pathname === '/')) {
      return NextResponse.redirect(new URL('/gemif/main', request.url));
    }

    // Redirect unauthenticated users to login (except on login/register pages)
    if (!hasSession && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register') && !(request.nextUrl.pathname === '/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Handle redirect if session exists but login count is 0
    if (hasSession && verification.session?.logincount === 0 &&
        !request.nextUrl.pathname.startsWith('/initial-setup') &&
        !API_ENDPOINTS.some((endpoint) => request.nextUrl.pathname.startsWith(endpoint))) {
      return NextResponse.redirect(new URL('/initial-setup', request.url));
    }

    // Redirect to '/gemif/calendar' if session exists and user is not in '/gemif' or '/initial-setup'
    if (hasSession &&
        !request.nextUrl.pathname.startsWith('/gemif') &&
        !request.nextUrl.pathname.startsWith('/initial-setup') &&
        !API_ENDPOINTS.some((endpoint) => request.nextUrl.pathname.startsWith(endpoint))) {
      return NextResponse.redirect(new URL('/gemif/main', request.url));
    }

    if (hasSession && request.nextUrl.pathname.startsWith('/initial-setup') && verification.session?.logincount !== 0) {
      return NextResponse.redirect(new URL('/gemif/main', request.url));
    }

    // Allow request to proceed
    const response = NextResponse.next();
    if (verification.session) {
      response.headers.set('X-User-Id', verification.session.id);
      response.headers.set('X-User-Github-Token', verification.session.githubtoken);
    }
    return response;
  } catch (error) {
    console.error('Session verification error:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|ico|svg|xml)$).*)',
    '/api/(.*)',
  ],
};