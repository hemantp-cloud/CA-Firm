import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Role-based protected routes
const roleRoutes = {
  SUPER_ADMIN: ["/super-admin"],
  ADMIN: ["/admin"],
  PROJECT_MANAGER: ["/project-manager"],
  TEAM_MEMBER: ["/team-member"],
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
    case "SUPER_ADMIN":
      return "/super-admin/dashboard"
    case "ADMIN":
      return "/admin/dashboard"
    case "PROJECT_MANAGER":
      return "/project-manager/dashboard"
    case "TEAM_MEMBER":
      return "/team-member/dashboard"
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
  const isSuperAdminRoute = matchesRoute(pathname, roleRoutes.SUPER_ADMIN)
  const isAdminRoute = matchesRoute(pathname, roleRoutes.ADMIN)
  const isProjectManagerRoute = matchesRoute(pathname, roleRoutes.PROJECT_MANAGER)
  const isTeamMemberRoute = matchesRoute(pathname, roleRoutes.TEAM_MEMBER)
  const isClientRoute = matchesRoute(pathname, roleRoutes.CLIENT)
  const isProtectedRoute = isSuperAdminRoute || isAdminRoute || isProjectManagerRoute || isTeamMemberRoute || isClientRoute

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

    // Role-based access control
    if (isSuperAdminRoute) {
      if (userRole !== "SUPER_ADMIN") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isAdminRoute) {
      // SUPER_ADMIN and ADMIN can access admin routes
      if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isProjectManagerRoute) {
      if (userRole !== "PROJECT_MANAGER") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isTeamMemberRoute) {
      if (userRole !== "TEAM_MEMBER") {
        const dashboardUrl = getDashboardUrl(userRole)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } else if (isClientRoute) {
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
