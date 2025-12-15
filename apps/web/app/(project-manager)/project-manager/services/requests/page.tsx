"use client"

import { useState, useEffect } from "react"
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    FileText,
    Calendar,
    User,
    Building2,
    AlertTriangle,
    Filter,
    Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import {
    getServiceRequests,
    approveServiceRequest,
    rejectServiceRequest,
    getServiceRequestStats
} from "@/lib/service-workflow-api"
import {
    ServiceRequest,
    RequestStatus,
    SERVICE_TYPE_LABELS,
    URGENCY_LABELS,
    RequestUrgency
} from "@/types/service-workflow"

// Status configuration for request statuses
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

export default function PMServiceRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [stats, setStats] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONVERTED' | 'REJECTED'>('PENDING')
    const [searchTerm, setSearchTerm] = useState('')

    // Approve dialog state
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
    const [approveData, setApproveData] = useState({
        quotedFee: '',
        dueDate: '',
        approvalNotes: '',
    })
    const [isApproving, setIsApproving] = useState(false)

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isRejecting, setIsRejecting] = useState(false)

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

    // Filter and search requests
    const filteredRequests = requests.filter(req => {
        // Status filter
        if (filter !== 'all' && req.status !== filter) return false

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            return (
                req.title.toLowerCase().includes(search) ||
                req.client?.name.toLowerCase().includes(search) ||
                SERVICE_TYPE_LABELS[req.serviceType].toLowerCase().includes(search)
            )
        }
        return true
    })

    // Sort by urgency (URGENT first) then by date
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        const urgencyOrder: Record<RequestUrgency, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const handleApproveClick = (request: ServiceRequest) => {
        setSelectedRequest(request)
        setApproveData({
            quotedFee: request.quotedFee?.toString() || '',
            dueDate: request.preferredDueDate?.split('T')[0] || '',
            approvalNotes: '',
        })
        setApproveDialogOpen(true)
    }

    const handleRejectClick = (request: ServiceRequest) => {
        setSelectedRequest(request)
        setRejectionReason('')
        setRejectDialogOpen(true)
    }

    const handleApprove = async () => {
        if (!selectedRequest) return

        setIsApproving(true)
        try {
            const response = await approveServiceRequest(selectedRequest.id, {
                quotedFee: approveData.quotedFee ? parseFloat(approveData.quotedFee) : undefined,
                dueDate: approveData.dueDate || undefined,
                approvalNotes: approveData.approvalNotes || undefined,
            })

            if (response.success) {
                toast.success('Request approved! Service has been created.')
                setApproveDialogOpen(false)
                fetchData()
            } else {
                toast.error(response.message || 'Failed to approve request')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve request')
        } finally {
            setIsApproving(false)
        }
    }

    const handleReject = async () => {
        if (!selectedRequest) return

        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setIsRejecting(true)
        try {
            const response = await rejectServiceRequest(selectedRequest.id, rejectionReason)

            if (response.success) {
                toast.success('Request rejected')
                setRejectDialogOpen(false)
                fetchData()
            } else {
                toast.error(response.message || 'Failed to reject request')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject request')
        } finally {
            setIsRejecting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Service Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Review and approve service requests from clients
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                    className={`border-0 shadow-sm cursor-pointer transition-all ${filter === 'PENDING' ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setFilter('PENDING')}
                >
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.PENDING || 0}
                                </p>
                                <p className="text-xs text-gray-500">Pending Review</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`border-0 shadow-sm cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-violet-500' : ''}`}
                    onClick={() => setFilter('all')}
                >
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

                <Card
                    className={`border-0 shadow-sm cursor-pointer transition-all ${filter === 'CONVERTED' ? 'ring-2 ring-emerald-500' : ''}`}
                    onClick={() => setFilter('CONVERTED')}
                >
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.CONVERTED || 0}
                                </p>
                                <p className="text-xs text-gray-500">Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`border-0 shadow-sm cursor-pointer transition-all ${filter === 'REJECTED' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setFilter('REJECTED')}
                >
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

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by title, client, or service type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Requests List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {filter === 'all' ? 'All Requests' :
                                filter === 'PENDING' ? 'Pending Requests' :
                                    filter === 'CONVERTED' ? 'Approved Requests' : 'Rejected Requests'}
                            ({sortedRequests.length})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                            <p className="text-gray-500 mt-2">Loading requests...</p>
                        </div>
                    ) : sortedRequests.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {filter === 'PENDING' ? 'No pending requests to review' : 'No requests found'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedRequests.map((request) => {
                                const statusConfig = REQUEST_STATUS_CONFIG[request.status]
                                const urgencyConfig = URGENCY_LABELS[request.urgency]
                                const isPending = request.status === 'PENDING'

                                return (
                                    <div
                                        key={request.id}
                                        className={`p-4 rounded-lg border transition-all ${isPending
                                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                                : 'bg-gray-50 dark:bg-slate-800 border-transparent'
                                            }`}
                                    >
                                        {/* Urgent Badge */}
                                        {request.urgency === 'URGENT' && (
                                            <div className="flex items-center gap-2 mb-2 text-red-600">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span className="text-xs font-bold uppercase">Urgent Request</span>
                                            </div>
                                        )}

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

                                        {/* Client Info */}
                                        {request.client && (
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    <span>{request.client.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>{request.client.email}</span>
                                                </div>
                                            </div>
                                        )}

                                        {request.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                                            {request.assessmentYear && (
                                                <span>AY: {request.assessmentYear}</span>
                                            )}
                                        </div>

                                        {/* Actions for Pending Requests */}
                                        {isPending && (
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <Button
                                                    onClick={() => handleApproveClick(request)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleRejectClick(request)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {request.status === 'REJECTED' && request.rejectionReason && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    <span className="font-medium">Rejection Reason: </span>
                                                    {request.rejectionReason}
                                                </p>
                                                {request.reviewedByName && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        By {request.reviewedByName} • {request.reviewedAt && formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Approval Info */}
                                        {request.status === 'CONVERTED' && (
                                            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                                    <span className="font-medium">Approved </span>
                                                    {request.quotedFee && `• Fee: ₹${request.quotedFee.toLocaleString('en-IN')}`}
                                                </p>
                                                {request.reviewedByName && (
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                                        By {request.reviewedByName} • {request.reviewedAt && formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Approve Request
                        </DialogTitle>
                        <DialogDescription>
                            Approve this request to create a new service
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedRequest.title}
                                </p>
                                <p className="text-sm text-gray-500">{selectedRequest.client?.name}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quotedFee">Quoted Fee (₹)</Label>
                                <Input
                                    id="quotedFee"
                                    type="number"
                                    placeholder="Enter fee amount"
                                    value={approveData.quotedFee}
                                    onChange={(e) => setApproveData(prev => ({ ...prev, quotedFee: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={approveData.dueDate}
                                    onChange={(e) => setApproveData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="approvalNotes">Notes (Optional)</Label>
                                <Textarea
                                    id="approvalNotes"
                                    placeholder="Add any notes for this approval..."
                                    value={approveData.approvalNotes}
                                    onChange={(e) => setApproveData(prev => ({ ...prev, approvalNotes: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveDialogOpen(false)}
                            disabled={isApproving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve & Create Service
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            Reject Request
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedRequest.title}
                                </p>
                                <p className="text-sm text-gray-500">{selectedRequest.client?.name}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rejectionReason">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="rejectionReason"
                                    placeholder="Explain why this request is being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isRejecting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectionReason.trim()}
                        >
                            {isRejecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
