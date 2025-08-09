

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './app/lib/helpers';

const PUBLIC_API_ROUTES = ['/api/verify', '/api/reset-password', '/api/verification-token', '/api/send-reset-password', '/api/send-verification-email', '/api/auth'];
const PUBLIC_PAGES = ['/', '/login', '/register'];
const PROTECTED_PUBLIC_PAGES = ['/verify-email', '/reset-password'];
const INITIAL_SETUP_PAGE = '/initial-setup';
const GEMIF_MAIN = '/gemif/main';
const ERROR = '/error';

const API_ENDPOINT_PREFIX = '/api';

const returnError = ({ request, title, description, code }: { request: NextRequest; title: string; description: string; code: string }) => {
  const errorUrl = new URL('/error', request.url);
      errorUrl.searchParams.set('title', title);
      errorUrl.searchParams.set('description', description);
      errorUrl.searchParams.set('code', code);
      const response = NextResponse.redirect(errorUrl);
      return response;
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  const isInternal = request.headers.get('X-Internal-Token') === process.env.INTERNAL_API_SECRET;
  const isApiRoute = pathname.startsWith(API_ENDPOINT_PREFIX);
  const isPublicApiRoute = PUBLIC_API_ROUTES.includes(pathname);
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const isProtectedPublicPage = PROTECTED_PUBLIC_PAGES.includes(pathname);
  const isInitialSetup = pathname.startsWith(INITIAL_SETUP_PAGE);

  
  if (pathname === ERROR) {
    return NextResponse.next();
  }
  try {
    const { session, ok, type, error } = await verifySession();

    const isAuth = type === 'auth';
    const isTokenBased = type === 'verify' || type === 'forgot';
    const loginCount = session?.logincount ?? -1;

    console.log('url: ', url, 'session:', session, 'isAuth:', isAuth, 'isTokenBased:', isTokenBased, 'isInternal:', isInternal, 'loginCount:', loginCount);
    
    // 1. Allow internal requests

    if (isInternal) {
      return NextResponse.next();
    }

    if (isInternal && isPublicApiRoute) {
      
      return NextResponse.next();
    }
    
    if (error) {
      return returnError({ request, title: "Error de autenticación", description: error, code: 'NO_AUTH' });
    }

    // 2. Always allow public pages
    if (!isAuth && isPublicPage) {
      
      return NextResponse.next();
    }

    // 3. Allow protected public pages only with token-based session
    if (isProtectedPublicPage) {
      if (!ok) {
        return returnError({ request, title: "Error de autenticación", description: error?? 'Sesion no encontrada', code: 'NO_AUTH' });
      }
      if (pathname === '/verify-email' && type === 'verify') {
        
        return NextResponse.next();
      } else if (pathname === '/reset-password' && type === 'forgot') {
        
        return NextResponse.next();
      } else {
        
        return returnError({ request, title: "Error de autenticación", description: 'Tu sesion no te permite acceder a esta pagina', code: 'NO_AUTH' });
      }
    }

    // 4. Block API requests without valid auth session or internal header
    if (isApiRoute && !isAuth) {
      return returnError({ request, title: "Error de autenticación", description: 'Permiso denegado', code: 'PERMISSION_DENIED' });
    }

    // 5. Redirect to initial-setup if logged in and loginCount === 0
    if (isAuth && loginCount === 0 && !isInitialSetup && !isApiRoute) {
      
      return NextResponse.redirect(new URL(INITIAL_SETUP_PAGE, request.url));
    }

    // 6. Redirect away from /initial-setup if loginCount !== 0
    if (isAuth && loginCount !== 0 && isInitialSetup) {
      
      return returnError({ request, title: "No autorizado", description: 'Permiso denegado para acceder a esta pagina', code: 'PERMISSION_DENIED' });
    }

    // 7. Redirect to /gemif/main if logged in and not in /gemif or /initial-setup or /api
    if (isAuth && !pathname.startsWith('/gemif') && !isInitialSetup && !isApiRoute) {
      
      return NextResponse.redirect(new URL(GEMIF_MAIN, request.url));
    }

    // 8. Block all other routes if user is not authenticated and not internal
    if (!isAuth && !isInternal && !isPublicPage && !isProtectedPublicPage && !isApiRoute) {
      
      return returnError({ request, title: "No autorizado", description: 'Permiso denegado para acceder a esta pagina', code: 'PERMISSION_DENIED' });
    }


    // 8. Default allow
    const response = NextResponse.next();
    

    if (isAuth && session) {
      response.headers.set('X-User-Id', session.id);
      if (session.githubtoken) {
        response.headers.set('X-User-Github-Token', session.githubtoken);
      }
    }

    return response;
  } catch (err: any) {
    console.error('Middleware error:', err);
    return returnError({ request, title: "Error de autenticación", description: err.message, code: 'PERMISSION_DENIED' });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|ico|svg|xml|txt)$).*)',
    '/api/(.*)',
  ],
};









// import { NextRequest, NextResponse } from 'next/server';
// import { verifyRegisterSession, verifySession } from './app/lib/helpers';

// const API_ENDPOINTS = [
//   '/api/ranking',
//   '/api/main-data',
//   '/api/main-posts',
//   '/api/events',
//   '/api/subjects',
//   '/api/primitive-subjects',
//   '/api/history',
//   '/api/exams',
//   '/api/messages',
//   '/api/user',
//   '/api/users',
//   '/api/auth',
//   '/api/weekly-challenges',
//   '/api/weekly-challenge-answers',
//   '/api/reset-password',
//   '/api/send-reset-password',
//   '/api/send-verification-email',
//   '/api/verify',
//   '/api/verification-token',
// ];

// const PUBLIC_ROUTES = [
//   '/api/reset-password',
//   '/api/send-verification-email',
//   '/api/verify',
// ];

// const PUBLIC_PAGES = [
//   '/verify-email',
//   '/reset-password',
//   '/login',
//   '/register',
//   '/initial-setup',
//   '/',
// ]

// const PUBLIC_PROTECTED_PAGES = [
//   '/initial-setup',
//   '/verify-email',
//   '/reset-password',
// ]

// export async function middleware(request: NextRequest) {
//   try {
//     const verification = await verifySession();
//     const sessionError = verification.error;
//     const hasSession = !sessionError;
//     const isInternal = request.headers.get('X-Internal-Token') === process.env.INTERNAL_API_SECRET;
//     const pathname = request.nextUrl.pathname;
//     const registerSession = await verifyRegisterSession();
//     const registerSessionError = registerSession.error;
//     const hasRegisterSession = !registerSessionError;

    
    
//     // 👇 Restrict /verify-email to only users with registerCookie
//     if (PUBLIC_ROUTES.includes(pathname)) {
//       if (!hasRegisterSession && !isInternal) {
        
//         return NextResponse.redirect(new URL('/', request.url));
//       }
//     }

//     // Redirect authenticated users away from login/register
//     if (
//       hasSession &&
//       (PUBLIC_PAGES.includes(pathname))
//     ) {
      
//       return NextResponse.redirect(new URL('/gemif/main', request.url));
//     }

//     // Redirect unauthenticated users to login (except on login/register pages)
//     if (
//       !hasSession &&
//       !PUBLIC_PAGES.includes(pathname) &&
//       !isInternal &&
//       !PUBLIC_ROUTES.includes(pathname) // 👈 avoid double-redirect, already handled above
//     ) {
      
//       return NextResponse.redirect(new URL('/', request.url));
//     }

//     if (
//       hasSession &&
//       verification.session?.logincount === 0 &&
//       !pathname.startsWith('/initial-setup') &&
//       !API_ENDPOINTS.some((endpoint) => pathname.startsWith(endpoint))
//     ) {
      
//       return NextResponse.redirect(new URL('/initial-setup', request.url));
//     }

//     // Redirect elsewhere if already past initial setup
//     if (
//       hasSession &&
//       pathname.startsWith('/initial-setup') &&
//       verification.session?.logincount !== 0
//     ) {
      
//       return NextResponse.redirect(new URL('/gemif/main', request.url));
//     }

//     if (
//       hasSession &&
//       !pathname.startsWith('/gemif') &&
//       !pathname.startsWith('/initial-setup') &&
//       !API_ENDPOINTS.some((endpoint) => pathname.startsWith(endpoint))
//     ) {
      
//       return NextResponse.redirect(new URL('/gemif/main', request.url));
//     }

//     const response = NextResponse.next();

//     if (verification.session) {
//       response.headers.set('X-User-Id', verification.session.id);
//       response.headers.set('X-User-Github-Token', verification.session.githubtoken);
//     }
    
//     return response;
//   } catch (error) {
//     console.error('Session verification error:', error);
//     return new NextResponse('Unauthorized', { status: 401 });
//   }
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|ico|svg|xml|txt)$).*)',
//     '/api/(.*)',
//   ],
// };
