"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  FileText,
  CreditCard,
  BarChart3,
  Activity,
  Settings,
  Search,
  LogOut,
  User,
  Menu,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import MobileSidebar from "@/components/layout/MobileSidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield } from "lucide-react"

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Project Managers", href: "/admin/project-managers" },
  { icon: User, label: "Team Members", href: "/admin/team-members" },
  { icon: UserCircle, label: "Clients", href: "/admin/client" },
  { icon: Briefcase, label: "Services", href: "/admin/services" },
  { icon: FileText, label: "Documents", href: "/admin/documents" },
  { icon: CreditCard, label: "Invoices", href: "/admin/invoices" },
  { icon: BarChart3, label: "Reports", href: "/admin/reports" },
  { icon: Activity, label: "Activity Logs", href: "/admin/activity" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = async () => {
    // Clear local storage first
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("auth-storage")
      localStorage.clear()
    }

    // Sign out with NextAuth
    await signOut({ redirect: false })

    // Force redirect to login page
    window.location.href = "/login"
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return "AD"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-[280px] bg-[#1e293b] dark:bg-slate-900 flex-col fixed left-0 top-0 h-full">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700 dark:border-slate-700">
          <div className="rounded-lg bg-blue-600 p-2">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white dark:text-white font-semibold text-lg">
              Admin Portal
            </span>
            <span className="text-slate-400 text-xs">
              Firm Management
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href) || false
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 dark:text-slate-300 hover:bg-slate-700 dark:hover:bg-slate-700 hover:text-white"
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "group-hover:text-white"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-t border-slate-700 dark:border-slate-700 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getUserInitials(session?.user?.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white dark:text-white text-sm font-medium truncate">
                {session?.user?.name || "Admin User"}
              </p>
              <p className="text-slate-400 dark:text-slate-400 text-xs truncate">
                {session?.user?.email || "admin@firm.com"}
              </p>
            </div>
          </div>

          {/* Logout Section */}
          <div className="space-y-2">
            <div className="border-t border-slate-700 dark:border-slate-700 pt-2"></div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-[280px] bg-gray-50 dark:bg-slate-800">
        {/* Mobile Header - Mobile Only */}
        <header className="flex lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 items-center justify-between">
          <MobileSidebar navigation={navigationItems} />
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-1.5">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-base">
              Admin Portal
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop Header - Desktop Only */}
        <header suppressHydrationWarning className="hidden lg:flex bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {getUserInitials(session?.user?.name)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session?.user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(session?.user as any)?.role || "ADMIN"}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

