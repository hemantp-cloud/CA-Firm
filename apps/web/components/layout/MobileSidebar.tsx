"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

interface MobileSidebarProps {
  navigation: NavigationItem[]
}

export default function MobileSidebar({ navigation }: MobileSidebarProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button variant="ghost" size="sm" className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700 dark:border-slate-700">
            <div className="rounded-lg bg-blue-600 p-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white dark:text-white font-semibold text-lg">Firm Portal</span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
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
          <div className="px-6 py-4 border-t border-slate-700 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">AU</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white dark:text-white text-sm font-medium truncate">Admin User</p>
                <p className="text-slate-400 dark:text-slate-400 text-xs truncate">admin@finserve.ca</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

