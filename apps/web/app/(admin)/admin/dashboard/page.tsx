"use client"

import { useState, useEffect } from "react"
import { Users, UserCircle, Briefcase, Clock, CreditCard, AlertCircle, Plus, FileText, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RevenueChart from "@/components/charts/RevenueChart"
import ServicesPieChart from "@/components/charts/ServicesPieChart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import api from "@/lib/api"
import Link from "next/link"

interface DashboardData {
  clientCount: number
  userCount: number
  activeServicesCount: number
  pendingServicesCount: number
  revenueThisMonth: number
  overdueInvoicesCount: number
  servicesByStatus: Array<{ status: string; count: number }>
  revenueTrend: Array<{ month: string; revenue: number }>
  servicesByType: Array<{ type: string; count: number }>
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    entityName: string
    userName: string
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format service status
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Prepare pie chart data
  const servicesPieData =
    dashboardData?.servicesByStatus.map((item, index) => {
      const colors = ["#2563eb", "#10b981", "#eab308", "#f97316", "#ef4444"]
      return {
        name: formatStatus(item.status),
        value: item.count,
        color: colors[index % colors.length],
      }
    }) || []

  // Prepare bar chart data
  const servicesBarData = dashboardData?.servicesByType || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's an overview of your Admin Dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/ca/new">
              <Users className="h-4 w-4 mr-2" />
              Add CA Partner
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/client/new">
              <UserCircle className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/services/new">
              <Briefcase className="h-4 w-4 mr-2" />
              New Service
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.clientCount || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active clients</p>
          </CardContent>
        </Card>

        {/* Total Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <UserCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total CAs</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.userCount || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chartered Accountants</p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Services</span>
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
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Services</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.pendingServicesCount || 0}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        {/* Revenue This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue This Month</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : formatCurrency(dashboardData?.revenueThisMonth || 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Invoices</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : dashboardData?.overdueInvoicesCount || 0}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div>
          <RevenueChart data={dashboardData?.revenueTrend || []} />
        </div>

        {/* Services by Status Pie Chart */}
        <div>
          <ServicesPieChart data={servicesPieData} />
        </div>
      </div>

      {/* Services by Type Bar Chart */}
      {servicesBarData.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Services by Type</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="type"
                  tickFormatter={(value) => formatStatus(value)}
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading activity...</div>
            ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.entityType}
                        </span>
                        {activity.entityName && (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {activity.entityName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by {activity.userName}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent activity to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

