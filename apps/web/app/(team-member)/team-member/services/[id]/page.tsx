"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Calendar,
    FileText,
    DollarSign,
    Clock,
    Loader2,
    Building2,
    ChevronDown,
    ChevronUp,
    History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"

// Import enhanced workflow components
import StatusTimeline, { StatusBadge } from "@/components/services/StatusTimeline"
import ServiceActionButtons from "@/components/services/ServiceActionButtons"
import StatusHistoryList from "@/components/services/StatusHistoryList"
import {
    ServiceStatus,
    ServiceStatusHistory,
    SERVICE_TYPE_LABELS
} from "@/types/service-workflow"
import { getStatusHistory } from "@/lib/service-workflow-api"

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
    currentAssigneeId: string | null
    currentAssigneeType: string | null
    currentAssigneeName: string | null
    startDate: string | null
    client: {
        id: string
        name: string
        email: string
    }
    tasks: Array<{
        id: string
        title: string
        status: string
        dueDate: string | null
    }>
    documents: Array<{
        id: string
        fileName: string
        documentType: string | null
    }>
}

export default function TeamMemberServiceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const serviceId = params.id as string

    const [service, setService] = useState<Service | null>(null)
    const [statusHistory, setStatusHistory] = useState<ServiceStatusHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showHistory, setShowHistory] = useState(false)

    const userRole = 'TEAM_MEMBER'

    useEffect(() => {
        if (serviceId) {
            fetchService()
            fetchStatusHistory()
        }
    }, [serviceId])

    const fetchService = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/team-member/services/${serviceId}`)
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

    const fetchStatusHistory = async () => {
        try {
            const response = await getStatusHistory(serviceId)
            if (response.success) {
                setStatusHistory(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch status history:", error)
        }
    }

    const handleActionComplete = () => {
        fetchService()
        fetchStatusHistory()
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500 ml-2">Loading service details...</p>
            </div>
        )
    }

    if (!service) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">Service not found</p>
                <Button asChild>
                    <Link href="/team-member/services">Back to Services</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/team-member/services">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {service.title}
                            </h1>
                            <StatusBadge status={service.status as ServiceStatus} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}
                            {service.financialYear && ` • FY ${service.financialYear}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Timeline */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Service Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusTimeline currentStatus={service.status as ServiceStatus} />
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Your Actions</p>
                            <p className="text-sm text-gray-500">
                                Actions available based on current service status
                            </p>
                        </div>
                        <ServiceActionButtons
                            serviceId={service.id}
                            status={service.status as ServiceStatus}
                            userRole={userRole}
                            isAssignee={true} // Team member viewing their assigned service
                            onActionComplete={handleActionComplete}
                            serviceName={service.title}
                            clientName={service.client?.name || 'Client'}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Info */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Service Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Client</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{service.client?.name}</p>
                                        <p className="text-xs text-gray-500">{service.client?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Due Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(service.dueDate)}
                                        </p>
                                    </div>
                                </div>

                                {service.startDate && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Started On</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(service.startDate)}
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

                                {service.notes && (
                                    <div className="md:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">
                                            Notes
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-300">{service.notes}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Tasks ({service.tasks.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {service.tasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No tasks for this service</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {service.tasks.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">{task.title}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={task.status as ServiceStatus} />
                                                </TableCell>
                                                <TableCell>{formatDate(task.dueDate)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Documents ({service.documents.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {service.documents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No documents found</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>File Name</TableHead>
                                            <TableHead>Type</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {service.documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">{doc.fileName}</TableCell>
                                                <TableCell>{doc.documentType || "-"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - History */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                            <CardHeader className="pb-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <History className="h-5 w-5 text-blue-600" />
                                            Status History
                                        </CardTitle>
                                        {showHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </Button>
                                </CollapsibleTrigger>
                            </CardHeader>
                            <CollapsibleContent>
                                <CardContent className="pt-2">
                                    <StatusHistoryList history={statusHistory} showDetailed={true} />
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                        {!showHistory && statusHistory.length > 0 && (
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-500">{statusHistory.length} status changes</p>
                                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setShowHistory(true)}>
                                    View history
                                </Button>
                            </CardContent>
                        )}
                    </Card>

                    {/* Quick Info */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {service.assessmentYear && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Assessment Year</p>
                                        <p className="font-medium text-gray-900 dark:text-white">AY {service.assessmentYear}</p>
                                    </div>
                                )}
                                {service.feeAmount && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Fee Amount</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(service.feeAmount)}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
