"use client"

import { useState, useEffect } from "react"
import { Eye, Calendar, Briefcase, Clock, CheckCircle2, AlertCircle, XCircle, Plus, Send, FileText, Pause, UserCheck, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface Service {
  id: string
  title: string
  type: string
  status: string
  dueDate: string | null
  description: string | null
}

export default function ClientServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/client/services")
      if (response.data.success) {
        setServices(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
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
      ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      IN_PROGRESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      WAITING_FOR_CLIENT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      UNDER_REVIEW: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      CHANGES_REQUESTED: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      DELIVERED: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      INVOICED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      CLOSED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return colors[status] || colors.PENDING
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED": return <UserCheck className="h-4 w-4" />
      case "IN_PROGRESS": return <Loader2 className="h-4 w-4" />
      case "WAITING_FOR_CLIENT": return <FileText className="h-4 w-4" />
      case "ON_HOLD": return <Pause className="h-4 w-4" />
      case "UNDER_REVIEW": return <AlertCircle className="h-4 w-4" />
      case "CHANGES_REQUESTED": return <AlertCircle className="h-4 w-4" />
      case "COMPLETED": return <CheckCircle2 className="h-4 w-4" />
      case "DELIVERED": return <Send className="h-4 w-4" />
      case "INVOICED": return <FileText className="h-4 w-4" />
      case "CLOSED": return <CheckCircle2 className="h-4 w-4" />
      case "CANCELLED": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      PENDING: 0,
      ASSIGNED: 10,
      IN_PROGRESS: 30,
      WAITING_FOR_CLIENT: 35,
      ON_HOLD: 35,
      UNDER_REVIEW: 50,
      CHANGES_REQUESTED: 55,
      COMPLETED: 70,
      DELIVERED: 85,
      INVOICED: 95,
      CLOSED: 100,
      CANCELLED: 0,
    }
    return progressMap[status] || 0
  }

  // Calculate stats
  const stats = {
    total: services.length,
    pending: services.filter(s => s.status === "PENDING").length,
    inProgress: services.filter(s => s.status === "IN_PROGRESS").length,
    completed: services.filter(s => s.status === "COMPLETED").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Services</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View all your services and their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/client/services/requests">
              <FileText className="h-4 w-4 mr-2" />
              My Requests
            </Link>
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link href="/client/services/request">
              <Plus className="h-4 w-4 mr-2" />
              Request Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">All Services ({services.length})</h2>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No services found</p>
              <p className="text-sm text-gray-400 mt-1">Services will appear here once assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/client/services/${service.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-violet-600 transition-colors">
                        {service.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Badge variant="outline">{formatStatus(service.type)}</Badge>
                        <Badge className={`${getStatusColor(service.status)} inline-flex items-center gap-1`}>
                          {getStatusIcon(service.status)}
                          {formatStatus(service.status)}
                        </Badge>
                        {service.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {formatDate(service.dueDate)}</span>
                          </div>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getProgress(service.status)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 transition-all"
                        style={{ width: `${getProgress(service.status)}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/client/services/${service.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
