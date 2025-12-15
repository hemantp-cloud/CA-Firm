"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Users,
  Briefcase,
  Clock,
  FileText,
  Plus,
  Eye,
  ArrowRight,
  TrendingUp,
  UserPlus,
  FolderPlus,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface DashboardData {
  userCount: number
  activeServicesCount: number
  pendingServicesCount: number
  teamMemberCount: number
  recentUsers: Array<{
    id: string
    name: string
    email: string
    servicesCount: number
    isActive: boolean
  }>
  recentServices: Array<{
    id: string
    title: string
    status: string
    user: {
      name: string
    }
    dueDate: string | null
  }>
}

export default function ProjectManagerDashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/project-manager/dashboard")
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return colors[status] || colors.PENDING
  }

  const stats = [
    {
      label: "My Clients",
      value: dashboardData?.userCount || 0,
      icon: Users,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      link: "/project-manager/clients",
    },
    {
      label: "Team Members",
      value: dashboardData?.teamMemberCount || 0,
      icon: UserPlus,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      link: "/project-manager/trainees",
    },
    {
      label: "Active Services",
      value: dashboardData?.activeServicesCount || 0,
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      link: "/project-manager/services",
    },
    {
      label: "Pending Tasks",
      value: dashboardData?.pendingServicesCount || 0,
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      link: "/project-manager/services?status=PENDING",
    },
  ]

  const quickActions = [
    {
      title: "Add Client",
      description: "Register a new client",
      icon: Users,
      href: "/project-manager/clients/new",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      title: "Add Team Member",
      description: "Add a new team member",
      icon: UserPlus,
      href: "/project-manager/trainees/new",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "New Service",
      description: "Create a service request",
      icon: Briefcase,
      href: "/project-manager/services/new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Upload Document",
      description: "Upload a new document",
      icon: FolderPlus,
      href: "/project-manager/documents",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name || "Project Manager"}! 👋
            </h1>
            <p className="text-emerald-100 text-lg">
              Here's an overview of your clients and services
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Project Manager Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.link}>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {isLoading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-t-lg border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className={`${action.color} text-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <action.icon className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Clients
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/project-manager/clients">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/project-manager/clients/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No clients yet</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/project-manager/clients/new">Add Your First Client</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Services
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/project-manager/services">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : dashboardData?.recentServices && dashboardData.recentServices.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentServices.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {service.title}
                        </p>
                        <Badge className={getStatusColor(service.status)}>
                          {formatStatus(service.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {service.user?.name || "Unknown Client"}
                      </p>
                      {service.dueDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Due: {formatDate(service.dueDate)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/project-manager/services/${service.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No services yet</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/project-manager/services/new">Create First Service</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            Recent Activity
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Activity tracking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
