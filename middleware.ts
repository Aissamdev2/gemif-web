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
  console.log('request.nextUrl: ', request.nextUrl, 'request.url: ', request.url);
  try {
    // Handle session verification for all requests
    const verification = await verifySession();
    const sessionError = verification.error;

    // Skip session check for login and register pages
    if ((sessionError === 'No session' || sessionError === 'No token') &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/register')) {
      console.log('sessionError: ', sessionError)
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    // Handle redirect if session exists but login count is 0
    if (!sessionError && verification.session?.logincount === 0 && 
        !request.nextUrl.pathname.startsWith('/initial-setup') && 
        !API_ENDPOINTS.some((endpoint) => !request.nextUrl.pathname.startsWith(endpoint))) {
      console.log('entered initial setup because login count is 0 and im not calling api: ', sessionError)
      return NextResponse.redirect(new URL('/initial-setup', request.nextUrl));
    }

    // Redirect to '/gemif/calendar' if session exists and page is not '/gemif' or '/initial-setup'
    if (!sessionError && !request.nextUrl.pathname.startsWith('/gemif') && 
        !request.nextUrl.pathname.startsWith('/initial-setup') && !API_ENDPOINTS.some((endpoint) => !request.nextUrl.pathname.startsWith(endpoint))) {
      console.log('entered gemif calendar because session exists and im not calling api: ', sessionError)
      return NextResponse.redirect(new URL('/gemif/calendar', request.nextUrl));
    }

    // Let the request continue if no redirect or session check fails
    
    const response = NextResponse.next();
    if (verification.session) {
      response.headers.set('X-User-Id', verification.session.id); // Set the userId in a custom header
      response.headers.set('X-User-Github-Token', verification.session.githubtoken);
    }
    console.log('Final redirect, response: ', response, 'session: ', verification.session);
    return response;
  } catch (error) {
    console.error('Session verification error:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)', '/api/(.*)'], // Match all API routes
};

