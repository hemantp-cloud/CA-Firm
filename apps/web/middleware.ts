import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Role-based protected routes
const roleRoutes = {
  ADMIN: ["/admin"],
  CA: ["/ca"],
  CLIENT: ["/client"],
}

// Public routes (accessible without authentication)
const publicRoutes = [
  "/login",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/auth/error",
]

// Routes that require authentication but are accessible to all roles
const authenticatedRoutes = [
  "/change-password",
]

// Helper function to get dashboard URL based on role
function getDashboardUrl(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"
    case "CA":
      return "/ca/dashboard"
    case "CLIENT":
      return "/client/dashboard"
    default:
      return "/login"
  }
}

// Helper function to check if path matches any route prefix
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Root path redirect to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Get token from NextAuth
  const token = await getToken({ req: request })

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Check if route requires authentication but is accessible to all roles
  const isAuthenticatedRoute = authenticatedRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Handle public routes
  if (isPublicRoute) {
    // If user is authenticated and tries to access login, redirect to dashboard
    if (pathname === "/login" && token) {
      const role = (token.role as string) || ""
      const dashboardUrl = getDashboardUrl(role)

      // Check if mustChangePassword flag exists
      const mustChangePassword = (token as any).mustChangePassword === true
      if (mustChangePassword) {
        return NextResponse.redirect(new URL("/change-password", request.url))
      }

      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Allow access to public routes
    return NextResponse.next()
  }

  // Handle authenticated routes (require auth but accessible to all roles)
  if (isAuthenticatedRoute) {
    // If no token, redirect to login
    if (!token) {
      const callbackUrl = encodeURIComponent(pathname)
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", callbackUrl)
      return NextResponse.redirect(loginUrl)
    }

    // Allow access to authenticated routes
    return NextResponse.next()
  }

  // Check if route is protected (role-based)
  const isAdminRoute = matchesRoute(pathname, roleRoutes.ADMIN)
  const isCaRoute = matchesRoute(pathname, roleRoutes.CA)
  const isClientRoute = matchesRoute(pathname, roleRoutes.CLIENT)
  const isProtectedRoute = isAdminRoute || isCaRoute || isClientRoute

  if (isProtectedRoute) {
    // If no token, redirect to login with callbackUrl
    if (!token) {
      const callbackUrl = encodeURIComponent(pathname)
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", callbackUrl)
      return NextResponse.redirect(loginUrl)
    }

    const role = (token.role as string) || ""
    const userRole = role.toUpperCase()

    // Check if user must change password
    // Note: mustChangePassword might need to be added to JWT token in NextAuth callback
    // For now, we'll check if it exists in the token
    const mustChangePassword = (token as any).mustChangePassword === true

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url))
    }

    // Role-based access control
    if (isAdminRoute) {
      // Only ADMIN can access /admin/* routes
      if (userRole !== "ADMIN") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isCaRoute) {
      // Only CA can access /ca/* routes
      if (userRole !== "CA") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isClientRoute) {
      // Only CLIENT can access /client/* routes
      if (userRole !== "CLIENT") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    }

    // User has correct role, allow access
    return NextResponse.next()
  }

  // For all other routes, allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
