"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import api from "@/lib/api"

interface DashboardData {
  projectManagerCount: number
  teamMemberCount: number
  clientCount: number
  activeServicesCount: number
  pendingServicesCount: number
  revenueThisMonth: number
  overdueInvoicesCount: number
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    entityName: string
    userType: string
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const response = await api.get("/admin/dashboard")
        if (response.data.success) {
          setDashboardData(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
  }

  // Format time for activity
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Stats Cards (similar to Super Admin but without Admins since Admin can't manage Admins)
  const statCards = [
    {
      title: "Project Managers",
      value: dashboardData?.projectManagerCount ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: "from-emerald-500 to-emerald-600",
      link: "/admin/project-managers",
    },
    {
      title: "Team Members",
      value: dashboardData?.teamMemberCount ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-amber-500 to-amber-600",
      link: "/admin/team-members",
    },
    {
      title: "Total Clients",
      value: dashboardData?.clientCount ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: "from-purple-500 to-purple-600",
      link: "/admin/client",
    },
    {
      title: "Active Services",
      value: dashboardData?.activeServicesCount ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      gradient: "from-blue-500 to-blue-600",
      link: "/admin/services",
    },
  ]

  // Quick Actions for Admin (can manage PMs, Team Members, Clients)
  const quickActions = [
    {
      title: "Add Project Manager",
      description: "Create a new PM",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "emerald",
      href: "/admin/project-managers/new",
    },
    {
      title: "Add Team Member",
      description: "Add team member",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "amber",
      href: "/admin/team-members/new",
    },
    {
      title: "Add Client",
      description: "Register new client",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "purple",
      href: "/admin/client/new",
    },
    {
      title: "New Service",
      description: "Create new service",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: "blue",
      href: "/admin/services/new",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-50", hover: "hover:bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
      emerald: { bg: "bg-emerald-50", hover: "hover:bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
      amber: { bg: "bg-amber-50", hover: "hover:bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
      purple: { bg: "bg-purple-50", hover: "hover:bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
    }
    return colors[color] || colors.blue
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "text-green-600 bg-green-100",
      UPDATE: "text-blue-600 bg-blue-100",
      DELETE: "text-red-600 bg-red-100",
      LOGIN: "text-purple-600 bg-purple-100",
    }
    return colors[action] || "text-gray-600 bg-gray-100"
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case "UPDATE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case "DELETE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const totalUsers = (dashboardData?.projectManagerCount ?? 0) + (dashboardData?.teamMemberCount ?? 0) + (dashboardData?.clientCount ?? 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name}! 👋</h1>
            <p className="mt-1 text-blue-100">
              Here&apos;s what&apos;s happening with your team today.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.link}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white shadow-lg`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {isLoading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View all</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const colors = getColorClasses(action.color)
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`flex items-center p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 group`}
              >
                <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                  {action.icon}
                </div>
                <div className="ml-4">
                  <p className={`font-medium ${colors.text}`}>{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Your Role</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Admin
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Pending Services</span>
              <span className="font-medium text-orange-600">{dashboardData?.pendingServicesCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Revenue This Month</span>
              <span className="font-medium text-green-600">{formatCurrency(dashboardData?.revenueThisMonth ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Overdue Invoices</span>
              <span className="font-medium text-red-600">{dashboardData?.overdueInvoicesCount ?? 0}</span>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Distribution</h2>
          <div className="space-y-4">
            {[
              { label: "Project Managers", value: dashboardData?.projectManagerCount ?? 0, color: "emerald" },
              { label: "Team Members", value: dashboardData?.teamMemberCount ?? 0, color: "amber" },
              { label: "Clients", value: dashboardData?.clientCount ?? 0, color: "purple" },
            ].map((item) => {
              const total = totalUsers || 1
              const percentage = Math.round((item.value / total) * 100) || 0
              const colorClasses: Record<string, string> = {
                emerald: "bg-emerald-500",
                amber: "bg-amber-500",
                purple: "bg-purple-500",
              }
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClasses[item.color]} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link
            href="/admin/activity"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading activity...</p>
          </div>
        ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userType}</span>
                    {" "}
                    <span className="text-gray-600">{activity.action.toLowerCase()}</span>
                    {" "}
                    <span className="font-medium">{activity.entityName || activity.entityType}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTime(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}
