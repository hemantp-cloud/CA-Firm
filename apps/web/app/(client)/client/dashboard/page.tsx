"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Briefcase, FileText, CreditCard, Upload, ArrowRight, Eye } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface DashboardData {
  activeServicesCount: number
  pendingInvoicesCount: number
  activeServices: Array<{
    id: string
    title: string
    status: string
    type: string
    dueDate: string | null
  }>
  recentDocuments: Array<{
    id: string
    fileName: string
    documentType: string | null
    uploadedAt: string
    isFromCA: boolean
  }>
  pendingInvoices: Array<{
    id: string
    invoiceNumber: string
    invoiceDate: string
    totalAmount: number
    status: string
  }>
}

export default function ClientDashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only fetch dashboard data when session is authenticated
    if (status === "authenticated" && session) {
      fetchDashboardData()
    } else if (status === "loading") {
      // Still loading session, wait
      setIsLoading(true)
    } else {
      // Not authenticated
      setIsLoading(false)
    }
  }, [status, session])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/client/dashboard")
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error)
      // Don't redirect on error to prevent loop
      if (error.response?.status === 401) {
        console.error("Authentication failed - token may not be synced yet")
      }
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
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
    }
    return colors[status] || colors.PENDING
  }

  const getProgress = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0
      case "IN_PROGRESS":
        return 50
      case "UNDER_REVIEW":
        return 75
      case "COMPLETED":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's an overview of your services and documents
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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

      {/* Active Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Services
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/client/services">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading services...</div>
          ) : dashboardData?.activeServices && dashboardData.activeServices.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.activeServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{service.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatStatus(service.type)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {formatStatus(service.status)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getProgress(service.status)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 transition-all"
                        style={{ width: `${getProgress(service.status)}%` }}
                      />
                    </div>
                    {service.dueDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {formatDate(service.dueDate)}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3" asChild>
                    <Link href={`/client/services/${service.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No active services</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Documents
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/documents">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/documents">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : dashboardData?.recentDocuments && dashboardData.recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.documentType && (
                          <Badge variant="outline" className="text-xs">
                            {doc.documentType}
                          </Badge>
                        )}
                        {doc.isFromCA && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                            From CA
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No documents yet</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/client/documents">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invoices */}
      {dashboardData?.pendingInvoices && dashboardData.pendingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending Invoices
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/invoices">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.invoiceDate)} • {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
                    <Link href={`/client/invoices/${invoice.id}/pay`}>
                      Pay Now
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

