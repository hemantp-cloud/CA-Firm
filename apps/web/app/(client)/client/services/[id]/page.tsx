"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Calendar,
  Loader2,
  Building2,
  User,
  DollarSign,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "sonner"

// Import new enhanced workflow components
import StatusTimeline, { StatusBadge, StatusProgressBar } from "@/components/services/StatusTimeline"
import ClientDocumentSlots from "@/components/services/ClientDocumentSlots"
import {
  ServiceStatus,
  STATUS_CONFIG,
  SERVICE_TYPE_LABELS
} from "@/types/service-workflow"

interface Service {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  dueDate: string | null
  completedAt: string | null
  feeAmount: number | null
  notes: string | null
  financialYear: string | null
  assessmentYear: string | null
  currentAssigneeName: string | null
  documents: Array<{
    id: string
    fileName: string
    documentType: string | null
    uploadedAt: string
    isFromCA: boolean
  }>
}

export default function ClientServiceDetailsPage() {
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
      const response = await api.get(`/client/services/${serviceId}`)
      if (response.data.success) {
        setService(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch service:", error)
      toast.error("Failed to load service details")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-"
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`
  }

  // Client-friendly status messages
  const getClientStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      PENDING: "Your service request is pending assignment to a team member.",
      ASSIGNED: "A team member has been assigned and will begin work soon.",
      IN_PROGRESS: "Our team is actively working on your service.",
      WAITING_FOR_CLIENT: "We need some documents or information from you to proceed.",
      ON_HOLD: "Work is temporarily paused. Please check notes for details.",
      UNDER_REVIEW: "The work is being reviewed for quality assurance.",
      CHANGES_REQUESTED: "Minor adjustments are being made.",
      COMPLETED: "Your service has been completed! Review pending delivery.",
      DELIVERED: "Your completed work has been delivered to you.",
      INVOICED: "An invoice has been generated for this service.",
      CLOSED: "This service is complete and closed.",
      CANCELLED: "This service has been cancelled.",
    }
    return messages[status] || "Status update pending."
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-gray-500 ml-2">Loading service details...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 mb-4">Service not found</p>
        <Button asChild>
          <Link href="/client/services">Back to Services</Link>
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[service.status as ServiceStatus]
  const isWaitingForClient = service.status === 'WAITING_FOR_CLIENT'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/client/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{service.title}</h1>
            <StatusBadge status={service.status as ServiceStatus} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}
            {service.financialYear && ` • FY ${service.financialYear}`}
          </p>
        </div>
      </div>

      {/* Waiting for Client Alert */}
      {isWaitingForClient && (
        <Card className="border-0 shadow-sm bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Action Required
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  We need some information or documents from you to continue.
                  Please check the required documents below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NEW: Document Slots - Shows required documents for upload */}
      <ClientDocumentSlots
        serviceId={serviceId}
        onSlotsUpdate={() => fetchService()}
      />

      {/* Status Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Service Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={service.status as ServiceStatus} />

          {/* Status Message for Client */}
          <div className={`mt-6 p-4 rounded-lg ${statusConfig?.bgColor || 'bg-gray-100'}`}>
            <p className={`text-sm ${statusConfig?.color || 'text-gray-600'}`}>
              {getClientStatusMessage(service.status)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}
                </p>
              </div>
            </div>

            {service.dueDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Expected Completion</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(service.dueDate)}
                  </p>
                </div>
              </div>
            )}

            {service.completedAt && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Completed On</p>
                  <p className="font-medium text-green-600">{formatDate(service.completedAt)}</p>
                </div>
              </div>
            )}

            {service.currentAssigneeName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {service.currentAssigneeName}
                  </p>
                </div>
              </div>
            )}

            {service.feeAmount && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Fee Amount</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(service.feeAmount)}
                  </p>
                </div>
              </div>
            )}

            {service.financialYear && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Financial Year</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    FY {service.financialYear}
                    {service.assessmentYear && ` / AY ${service.assessmentYear}`}
                  </p>
                </div>
              </div>
            )}

            {service.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white">{service.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes from Firm */}
      {service.notes && (
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Building2 className="h-5 w-5" />
              Notes from Your CA Firm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 dark:text-gray-200">{service.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Documents ({service.documents.length})</CardTitle>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700" asChild>
              <Link href={`/client/documents?serviceId=${serviceId}`}>
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
              <p className="text-sm mt-1">Upload documents required for this service</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={`/client/documents?serviceId=${serviceId}`}>
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
                          From Firm
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

      {/* Progress Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Overall Progress</p>
            <StatusProgressBar status={service.status as ServiceStatus} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
