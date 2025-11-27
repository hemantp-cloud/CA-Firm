"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Upload, Download, FileText, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import api from "@/lib/api"

interface Service {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  dueDate: string | null
  notes: string | null
  documents: Array<{
    id: string
    fileName: string
    documentType: string | null
    uploadedAt: string
    isFromCA: boolean
  }>
}

const statusTimeline = [
  { status: "PENDING", label: "Pending", icon: Clock, color: "text-gray-500" },
  { status: "IN_PROGRESS", label: "In Progress", icon: AlertCircle, color: "text-blue-500" },
  { status: "UNDER_REVIEW", label: "Under Review", icon: FileText, color: "text-yellow-500" },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle, color: "text-green-500" },
]

export default function ServiceDetailsPage() {
  const params = useParams()
  const serviceId = params.id as string

  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/user/services/${serviceId}`)
      if (response.data.success) {
        setService(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch service:", error)
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
    }
    return colors[status] || colors.PENDING
  }

  const getCurrentStatusIndex = (status: string) => {
    return statusTimeline.findIndex((s) => s.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading service details...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 mb-4">Service not found</p>
        <Button asChild>
          <Link href="/user/services">Back to Services</Link>
        </Button>
      </div>
    )
  }

  const currentStatusIndex = getCurrentStatusIndex(service.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/user/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{service.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Service details and documents</p>
        </div>
      </div>

      {/* Service Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Information</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {formatStatus(service.type)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge className={getStatusColor(service.status)}>
                {formatStatus(service.status)}
              </Badge>
            </div>
            {service.dueDate && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(service.dueDate)}
                  </p>
                </div>
              </div>
            )}
            {service.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-gray-900 dark:text-white mt-1">{service.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Status Timeline</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative">
            {statusTimeline.map((item, index) => {
              const Icon = item.icon
              const isActive = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex

              return (
                <div key={item.status} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isActive
                        ? isCurrent
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "bg-green-600 border-green-600 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${
                      isActive ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  {index < statusTimeline.length - 1 && (
                    <div
                      className={`absolute top-6 left-full w-full h-0.5 ${
                        isActive ? "bg-green-600" : "bg-gray-300"
                      }`}
                      style={{ width: "calc(100% - 3rem)", marginLeft: "1.5rem" }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Documents ({service.documents.length})
            </h2>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
              <Link href={`/user/documents?serviceId=${serviceId}`}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {service.documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No documents yet</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={`/user/documents?serviceId=${serviceId}`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {service.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>{doc.documentType || "-"}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      {doc.isFromCA ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          From CA
                        </Badge>
                      ) : (
                        <Badge variant="outline">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes from CA */}
      {service.notes && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes from CA</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white">{service.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

