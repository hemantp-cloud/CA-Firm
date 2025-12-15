"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    FileText,
    Calendar,
    ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { getServiceRequests, cancelServiceRequest, getServiceRequestStats } from "@/lib/service-workflow-api"
import {
    ServiceRequest,
    RequestStatus,
    SERVICE_TYPE_LABELS,
    URGENCY_LABELS
} from "@/types/service-workflow"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Status configuration
const REQUEST_STATUS_CONFIG: Record<RequestStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode
}> = {
    PENDING: {
        label: 'Pending Review',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: <Clock className="h-4 w-4" />,
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: <AlertCircle className="h-4 w-4" />,
    },
    APPROVED: {
        label: 'Approved',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: <CheckCircle className="h-4 w-4" />,
    },
    REJECTED: {
        label: 'Rejected',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: <XCircle className="h-4 w-4" />,
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        icon: <XCircle className="h-4 w-4" />,
    },
    CONVERTED: {
        label: 'Service Created',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: <CheckCircle className="h-4 w-4" />,
    },
}

export default function ClientServiceRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [stats, setStats] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [requestToCancel, setRequestToCancel] = useState<string | null>(null)
    const [isCancelling, setIsCancelling] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [requestsRes, statsRes] = await Promise.all([
                getServiceRequests(),
                getServiceRequestStats(),
            ])

            if (requestsRes.success) {
                setRequests(requestsRes.data)
            }
            if (statsRes.success) {
                setStats(statsRes.data)
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load service requests")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelRequest = async () => {
        if (!requestToCancel) return

        setIsCancelling(true)
        try {
            const response = await cancelServiceRequest(requestToCancel)
            if (response.success) {
                toast.success("Request cancelled successfully")
                fetchData()
            } else {
                toast.error(response.message || "Failed to cancel request")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel request")
        } finally {
            setIsCancelling(false)
            setCancelDialogOpen(false)
            setRequestToCancel(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        My Service Requests
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage your service requests
                    </p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700" asChild>
                    <Link href="/client/services/request">
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total || 0}
                                </p>
                                <p className="text-xs text-gray-500">Total Requests</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.PENDING || 0}
                                </p>
                                <p className="text-xs text-gray-500">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.CONVERTED || 0}
                                </p>
                                <p className="text-xs text-gray-500">Converted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.REJECTED || 0}
                                </p>
                                <p className="text-xs text-gray-500">Rejected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Requests List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle>All Requests ({requests.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                            <p className="text-gray-500 mt-2">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No service requests yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Click "New Request" to submit your first service request
                            </p>
                            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" asChild>
                                <Link href="/client/services/request">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Request
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => {
                                const statusConfig = REQUEST_STATUS_CONFIG[request.status]
                                const urgencyConfig = URGENCY_LABELS[request.urgency]

                                return (
                                    <div
                                        key={request.id}
                                        className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {request.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge variant="outline">
                                                        {SERVICE_TYPE_LABELS[request.serviceType]}
                                                    </Badge>
                                                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} inline-flex items-center gap-1`}>
                                                        {statusConfig.icon}
                                                        {statusConfig.label}
                                                    </Badge>
                                                    <Badge variant="outline" className={urgencyConfig.color}>
                                                        {urgencyConfig.label} Priority
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>

                                        {request.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                {request.description}
                                            </p>
                                        )}

                                        {/* Additional Info */}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            {request.preferredDueDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Preferred: {format(new Date(request.preferredDueDate), 'MMM d, yyyy')}</span>
                                                </div>
                                            )}
                                            {request.financialYear && (
                                                <span>FY: {request.financialYear}</span>
                                            )}
                                        </div>

                                        {/* Rejection Reason */}
                                        {request.status === 'REJECTED' && request.rejectionReason && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    <span className="font-medium">Reason: </span>
                                                    {request.rejectionReason}
                                                </p>
                                            </div>
                                        )}

                                        {/* Converted Service Link */}
                                        {request.status === 'CONVERTED' && request.convertedToService && (
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                                        <span className="font-medium">Service Created: </span>
                                                        {request.convertedToService.title}
                                                    </p>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/client/services/${request.convertedToService.id}`}>
                                                            View Service
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {request.status === 'PENDING' && (
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => {
                                                        setRequestToCancel(request.id)
                                                        setCancelDialogOpen(true)
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Cancel Request
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Service Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this service request? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelRequest}
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Yes, Cancel'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
