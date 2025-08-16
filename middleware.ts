import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Middleware logic runs after authentication check
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages and API routes
        if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except /api/auth)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};