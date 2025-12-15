"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Briefcase, FileText, CreditCard, Upload, ArrowRight, Eye, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface DashboardData {
  activeServicesCount: number
  pendingInvoicesCount: number
  totalDocuments: number
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
    if (status === "authenticated" && session) {
      fetchDashboardData()
    } else if (status === "loading") {
      setIsLoading(true)
    } else {
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
      case "PENDING": return 0
      case "IN_PROGRESS": return 50
      case "UNDER_REVIEW": return 75
      case "COMPLETED": return 100
      default: return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {session?.user?.name || "Client"}! 👋
            </h1>
            <p className="text-violet-100 mt-1">
              Here's an overview of your services and documents
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm font-medium">Client Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Services
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {isLoading ? "-" : dashboardData?.activeServicesCount || 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <Link href="/client/services" className="text-sm text-violet-600 hover:text-violet-800 mt-4 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Invoices
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {isLoading ? "-" : dashboardData?.pendingInvoicesCount || 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <Link href="/client/invoices" className="text-sm text-yellow-600 hover:text-yellow-800 mt-4 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  My Documents
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {isLoading ? "-" : dashboardData?.recentDocuments?.length || 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <Link href="/client/documents" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-violet-600">+</span> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/client/services">
            <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">View Services</h3>
                    <p className="text-violet-100 text-sm">Check your service status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/documents">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Upload Document</h3>
                    <p className="text-blue-100 text-sm">Share files with us</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/invoices">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Pay Invoices</h3>
                    <p className="text-green-100 text-sm">View and pay bills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/profile">
            <Card className="bg-gradient-to-br from-gray-600 to-gray-700 border-0 cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">My Profile</h3>
                    <p className="text-gray-200 text-sm">View your details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Active Services & Pending Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Services */}
        <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
            <h2 className="text-lg font-semibold">Active Services</h2>
            <Link href="/client/services">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : dashboardData?.activeServices && dashboardData.activeServices.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.activeServices.slice(0, 3).map((service) => (
                  <div
                    key={service.id}
                    className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link href={`/client/services/${service.id}`} className="font-medium text-gray-900 dark:text-white hover:text-violet-600">
                          {service.title}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatStatus(service.type)}</p>
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
                          className="h-full bg-violet-600 transition-all"
                          style={{ width: `${getProgress(service.status)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active services</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
            <h2 className="text-lg font-semibold">Pending Invoices</h2>
            <Link href="/client/invoices">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : dashboardData?.pendingInvoices && dashboardData.pendingInvoices.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.pendingInvoices.slice(0, 3).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <Button size="sm" className="mt-2 bg-violet-600 hover:bg-violet-700" asChild>
                        <Link href={`/client/invoices/${invoice.id}/pay`}>
                          Pay Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending invoices</p>
                <p className="text-sm text-green-600 mt-1">You're all caught up! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Recent Documents</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" asChild>
              <Link href="/client/documents">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Link>
            </Button>
            <Link href="/client/documents">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : dashboardData?.recentDocuments && dashboardData.recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentDocuments.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.documentType && (
                          <Badge variant="outline" className="text-xs">
                            {doc.documentType.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {doc.isFromCA && (
                          <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 text-xs">
                            From Firm
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
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents yet</p>
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
    </div>
  )
}
