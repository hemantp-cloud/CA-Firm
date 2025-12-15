"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DashboardStats {
    admins: number
    projectManagers: number
    teamMembers: number
    clients: number
    totalUsers: number
}

export default function SuperAdminDashboard() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.accessToken) return

            try {
                const response = await fetch("http://localhost:4000/api/super-admin/dashboard", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setStats(data.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [session?.accessToken])

    const statCards = [
        {
            title: "Total Admins",
            value: stats?.admins ?? 0,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            gradient: "from-blue-500 to-blue-600",
            bg: "bg-blue-500/10",
            link: "/super-admin/admins",
        },
        {
            title: "Project Managers",
            value: stats?.projectManagers ?? 0,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            gradient: "from-emerald-500 to-emerald-600",
            bg: "bg-emerald-500/10",
            link: "/super-admin/project-managers",
        },
        {
            title: "Team Members",
            value: stats?.teamMembers ?? 0,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            gradient: "from-amber-500 to-amber-600",
            bg: "bg-amber-500/10",
            link: "/super-admin/team-members",
        },
        {
            title: "Total Clients",
            value: stats?.clients ?? 0,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-purple-500/10",
            link: "/super-admin/clients",
        },
    ]

    const quickActions = [
        {
            title: "Add Admin",
            description: "Create a new admin user",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            color: "blue",
            href: "/super-admin/admins/new",
        },
        {
            title: "Add Project Manager",
            description: "Create a new CA/PM",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            color: "emerald",
            href: "/super-admin/project-managers/new",
        },
        {
            title: "Add Team Member",
            description: "Add trainee/staff",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            color: "amber",
            href: "/super-admin/team-members/new",
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
            href: "/super-admin/clients/new",
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

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name}! 👋</h1>
                        <p className="mt-1 text-purple-100">
                            Here&apos;s what&apos;s happening with your CA firm today.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                        <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <p className="text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
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
                                        {loading ? (
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

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Firm Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Firm Overview</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Organization</span>
                            <span className="font-medium text-gray-900">CA Firm Management</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Your Role</span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                Super Admin
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Total Active Users</span>
                            <span className="font-medium text-gray-900">{stats?.totalUsers ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-gray-600">Status</span>
                            <span className="flex items-center text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                All Systems Operational
                            </span>
                        </div>
                    </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h2>
                    <div className="space-y-4">
                        {[
                            { label: "Admins", value: stats?.admins ?? 0, color: "blue" },
                            { label: "Project Managers", value: stats?.projectManagers ?? 0, color: "emerald" },
                            { label: "Team Members", value: stats?.teamMembers ?? 0, color: "amber" },
                            { label: "Clients", value: stats?.clients ?? 0, color: "purple" },
                        ].map((item) => {
                            const total = stats?.totalUsers || 1
                            const percentage = Math.round((item.value / total) * 100) || 0
                            const colorClasses: Record<string, string> = {
                                blue: "bg-blue-500",
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
            <RecentActivityWidget />
        </div>
    )
}

// Recent Activity Widget Component
function RecentActivityWidget() {
    const { data: session } = useSession()
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentActivity()
    }, [])

    const fetchRecentActivity = async () => {
        if (!session?.accessToken) return

        try {
            const response = await fetch("http://localhost:4000/api/super-admin/recent-activity?limit=10", {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setActivities(data.data)
                }
            }
        } catch (error) {
            console.error("Failed to fetch recent activity:", error)
        } finally {
            setLoading(false)
        }
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <Link
                    href="/super-admin/audit-logs"
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center"
                >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading activity...</p>
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm text-gray-500">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity) => (
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
            )}
        </div>
    )
}
