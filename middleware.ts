import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from './app/lib/helpers';

export async function middleware(request: NextRequest) {
  const verification = await verifySession()

  const sessionError = verification.error

  if ((sessionError === 'No session' || sessionError === 'No token') && (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register'))) {
    return Response.redirect(new URL(`/login`, request.url))
  }

  if (!sessionError && verification.session?.logincount === 0 && !(request.nextUrl.pathname.startsWith('/initial-setup'))) { 
    console.log('initial-setup, cookie is: ', verification.session)
    return Response.redirect(new URL('/initial-setup', request.url))
  }

  if (!sessionError && (!request.nextUrl.pathname.startsWith('/gemif')) && (!request.nextUrl.pathname.startsWith('/initial-setup'))) { 
    return Response.redirect(new URL('/gemif/calendar', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
