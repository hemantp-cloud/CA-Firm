"use client"

import { useState, useEffect } from "react"
import { UserCircle, Briefcase, Clock, CreditCard, Plus, Eye } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface DashboardData {
  userCount: number
  activeServicesCount: number
  pendingServicesCount: number
  pendingInvoicesCount: number
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

export default function CADashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/ca/dashboard")
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your clients and their services
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/ca/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Clients
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.userCount || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your clients</p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Services
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.activeServicesCount || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In progress</p>
          </CardContent>
        </Card>

        {/* Pending Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Services
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.pendingServicesCount || 0}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Invoices
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.pendingInvoicesCount || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Clients
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ca/clients">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading clients...</div>
            ) : dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <Badge
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {user.servicesCount} service{user.servicesCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/ca/clients/${user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserCircle className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No clients yet</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/ca/clients/new">Add Your First Client</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Services
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ca/services">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading services...</div>
            ) : dashboardData?.recentServices && dashboardData.recentServices.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.user.name}
                      </p>
                      {service.dueDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Due: {formatDate(service.dueDate)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/ca/services/${service.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No services yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

