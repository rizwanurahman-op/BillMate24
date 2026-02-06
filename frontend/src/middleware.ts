import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/admin', '/shopkeeper'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth token in cookies
    const token = request.cookies.get('accessToken')?.value;
    const userRole = request.cookies.get('userRole')?.value;
    const isAuthenticated = !!token;

    // Determine dashboard based on role
    const getDashboardPath = () => {
        if (userRole === 'admin') return '/admin/dashboard';
        return '/shopkeeper/dashboard';
    };

    // For protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check role-based access
        if (pathname.startsWith('/admin') && userRole !== 'admin') {
            return NextResponse.redirect(new URL('/shopkeeper/dashboard', request.url));
        }
        if (pathname.startsWith('/shopkeeper') && userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    // For auth routes (login, register)
    if (authRoutes.some(route => pathname.startsWith(route))) {
        if (isAuthenticated) {
            // Redirect to appropriate dashboard based on role
            return NextResponse.redirect(new URL(getDashboardPath(), request.url));
        }
    }

    // Redirect root to login or dashboard
    if (pathname === '/') {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL(getDashboardPath(), request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    ],
};
