"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    Edit,
    Trash2,
    User,
    Calendar,
    FileText,
    DollarSign,
    Clock,
    UserPlus,
    Share2,
    History,
    Loader2,
    Building2,
    ChevronDown,
    ChevronUp,
    Shield
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"

// Enhanced workflow components
import StatusTimeline, { StatusBadge } from "@/components/services/StatusTimeline"
import ServiceActionButtons from "@/components/services/ServiceActionButtons"
import StatusHistoryList from "@/components/services/StatusHistoryList"
import AssignDialog from "@/components/services/AssignDialog"
import {
    ServiceStatus,
    STATUS_CONFIG,
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
    origin: string
    currentAssigneeId: string | null
    currentAssigneeType: string | null
    currentAssigneeName: string | null
    createdBy: string | null
    createdByRole: string | null
    createdByName: string | null
    startDate: string | null
    internalNotes: string | null
    client: {
        id: string
        name: string
        email: string
        phone?: string
    }
    projectManager?: {
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

export default function SuperAdminServiceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const serviceId = params.id as string

    const [service, setService] = useState<Service | null>(null)
    const [statusHistory, setStatusHistory] = useState<ServiceStatusHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showHistory, setShowHistory] = useState(false)
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [assignMode, setAssignMode] = useState<'assign' | 'delegate'>('assign')

    const userRole = 'SUPER_ADMIN'

    useEffect(() => {
        if (serviceId) {
            fetchService()
            fetchStatusHistory()
        }
    }, [serviceId])

    const fetchService = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/admin/services/${serviceId}`)
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

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return

        try {
            await api.delete(`/admin/services/${serviceId}`)
            toast.success("Service deleted successfully")
            router.push("/super-admin/services")
        } catch (error) {
            console.error("Failed to delete service:", error)
            toast.error("Failed to delete service")
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
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-500 ml-2">Loading service details...</p>
            </div>
        )
    }

    if (!service) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">Service not found</p>
                <Button asChild>
                    <Link href="/super-admin/services">Back to Services</Link>
                </Button>
            </div>
        )
    }

    const isPending = service.status === 'PENDING'
    const canAssign = isPending
    const canDelegate = ['ASSIGNED', 'IN_PROGRESS'].includes(service.status)

    return (
        <div className="space-y-6">
            {/* Admin Badge */}
            <div className="flex items-center gap-2 text-indigo-600">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Super Admin View</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/super-admin/services">
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
                <div className="flex gap-2">
                    {canAssign && (
                        <Button onClick={() => { setAssignMode('assign'); setAssignDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                        </Button>
                    )}
                    {canDelegate && (
                        <Button variant="outline" onClick={() => { setAssignMode('delegate'); setAssignDialogOpen(true); }}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Delegate
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={`/super-admin/services/${serviceId}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Status Timeline */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        Service Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusTimeline currentStatus={service.status as ServiceStatus} />
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-0 shadow-sm bg-indigo-50 dark:bg-indigo-900/20">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Admin Actions</p>
                            <p className="text-sm text-gray-500">
                                {service.currentAssigneeName
                                    ? `Assigned to ${service.currentAssigneeName}`
                                    : 'Not yet assigned'}
                            </p>
                        </div>
                        <ServiceActionButtons
                            serviceId={service.id}
                            status={service.status as ServiceStatus}
                            userRole={userRole}
                            isAssignee={true}
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

                                {service.currentAssigneeName && (
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Assigned To</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{service.currentAssigneeName}</p>
                                            <p className="text-xs text-gray-500">{service.currentAssigneeType}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Due Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(service.dueDate)}</p>
                                    </div>
                                </div>

                                {service.feeAmount && (
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Fee Amount</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(service.feeAmount)}</p>
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
                                        <p className="text-sm text-blue-600 font-medium">Client Notes</p>
                                        <p className="text-gray-700 dark:text-gray-300">{service.notes}</p>
                                    </div>
                                )}

                                {service.internalNotes && (
                                    <div className="md:col-span-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <p className="text-sm text-amber-600 font-medium">Internal Notes</p>
                                        <p className="text-gray-700 dark:text-gray-300">{service.internalNotes}</p>
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
                                <div className="text-center py-8 text-gray-500">No tasks</div>
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
                                                <TableCell><StatusBadge status={task.status as ServiceStatus} /></TableCell>
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
                                <div className="text-center py-8 text-gray-500">No documents</div>
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

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                            <CardHeader className="pb-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <History className="h-5 w-5 text-indigo-600" />
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
                                <p className="text-sm text-gray-500">{statusHistory.length} changes</p>
                                <Button variant="link" className="p-0 h-auto text-indigo-600" onClick={() => setShowHistory(true)}>
                                    View history
                                </Button>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Origin</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {service.origin === 'CLIENT_REQUEST' ? 'Client Request' :
                                            service.origin === 'FIRM_CREATED' ? 'Created by Firm' : service.origin}
                                    </p>
                                </div>
                                {service.createdByName && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Created By</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{service.createdByName}</p>
                                        <p className="text-xs text-gray-500">{service.createdByRole}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AssignDialog
                serviceId={service.id}
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                onSuccess={handleActionComplete}
                mode={assignMode}
                currentAssigneeName={service.currentAssigneeName || undefined}
            />
        </div>
    )
}
