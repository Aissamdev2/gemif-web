

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './auth/dal';
import { isFailure, unwrap, unwrapError } from './lib/errors/result';
import { errorUrl, redirectErrorUrl } from './lib/utils';
import { error } from 'console';

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

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  const isInternal = request.headers.get('X-Internal-Token') === process.env.INTERNAL_API_SECRET;

  
  if (pathname === ERROR) {
    return NextResponse.next();
  }
  try {
    const sessionResult = await verifySession()
    if (isFailure(sessionResult)) return NextResponse.redirect(new URL(errorUrl(unwrapError(sessionResult), pathname)));
    const session = unwrap(sessionResult)

    const isAuth = session?.userId;
    const isVerified = session?.flags?.is_verified;
    const isCompleteUserInfo = session?.flags?.is_complete_user_info;
    const isCompleteSubjects = session?.flags?.is_complete_subjects;

    // 1. Allow internal requests
    if (isInternal) {
      return NextResponse.next();
    }
    
    if (isAuth) {
      if (!isVerified && !pathname.startsWith('/verify-email')) {
        return NextResponse.redirect(new URL('/verify-email/send', request.url));
      }

      if (isVerified && !isCompleteUserInfo && pathname !== '/initial-setup/user-info') {
        return NextResponse.redirect(new URL('/initial-setup/user-info', request.url));
      }

      if (isVerified && isCompleteUserInfo && !isCompleteSubjects && pathname !== '/initial-setup/subjects') {
        return NextResponse.redirect(new URL('/initial-setup/subjects', request.url));
      }

      if (!pathname.startsWith('/gemif') && pathname !== '/logout' && pathname !== '/' && !pathname.startsWith('/playground') && isVerified && isCompleteUserInfo && isCompleteSubjects)
        return NextResponse.redirect(new URL('/gemif/main', request.url));

    } else {
      const url = new URL(request.url)
      if (pathname.startsWith("/playground/magic")) {
        return NextResponse.next()
      }
      const simulationToken = url.searchParams.get('simulation-token')
      if (pathname.startsWith('/playground') && !pathname.startsWith("/playground/magic") && simulationToken === process.env.SIMULATION_TOKEN) {
        return NextResponse.next()
      }
      if (!PUBLIC_PAGES.includes(pathname)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // 8. Default allow
    const response = NextResponse.next();
    return response;
  } catch (err: any) {
    console.error('Middleware error:', err);
    return returnError({ request, title: "Error de autenticación", description: err.message, code: 'PERMISSION_DENIED' });
  }
}
export const config = {
  matcher: [
    /*
     * Match everything except:
     * - Next.js internals (_next/static, _next/image)
     * - Common static file extensions
     */
    '/((?!_next/static|_next/image|.*\\.(?:css|js|png|jpg|jpeg|ico|svg|xml|txt|woff|woff2|eot|ttf|otf|json)$).*)',
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