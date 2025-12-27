"use client"

import { useState, useEffect } from "react"
import {
    Upload,
    Check,
    X,
    AlertCircle,
    Clock,
    FileCheck,
    Link2,
    Loader2,
    Calendar,
    File,
    Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"
import DocumentUpload from "@/components/documents/DocumentUpload"

interface DocumentSlot {
    id: string
    documentName: string
    category: string | null
    description: string | null
    isRequired: boolean
    status: string
    deadline: string | null
    requestMessage: string | null
    priority: string | null
    rejectionReason: string | null
    linkedDocument: {
        id: string
        fileName: string
        fileType: string
        uploadedAt: string
    } | null
    uploadedDocument: {
        id: string
        fileName: string
        fileType: string
        uploadedAt: string
    } | null
}

interface ClientDocumentSlotsProps {
    serviceId: string
    onSlotsUpdate?: () => void
}

export default function ClientDocumentSlots({
    serviceId,
    onSlotsUpdate
}: ClientDocumentSlotsProps) {
    const [loading, setLoading] = useState(true)
    const [slots, setSlots] = useState<DocumentSlot[]>([])
    const [uploadSlotId, setUploadSlotId] = useState<string | null>(null)
    const [uploadSlotName, setUploadSlotName] = useState<string>("")

    useEffect(() => {
        if (serviceId) {
            loadSlots()
        }
    }, [serviceId])

    const loadSlots = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/document-slots/client/services/${serviceId}/slots`)
            if (response.data.success) {
                setSlots(response.data.data)
            }
        } catch (error) {
            console.error("Error loading slots:", error)
            toast.error("Failed to load document requirements")
        } finally {
            setLoading(false)
        }
    }

    const handleUploadSuccess = async (document: any) => {
        // Link the uploaded document to the slot
        if (uploadSlotId) {
            try {
                const response = await api.post(`/document-slots/client/slots/${uploadSlotId}/upload`, {
                    documentId: document.id
                })

                if (response.data.success) {
                    toast.success("Document uploaded successfully!")
                    setUploadSlotId(null)
                    loadSlots()
                    onSlotsUpdate?.()
                }
            } catch (error: any) {
                console.error("Error linking document to slot:", error)
                toast.error(error.response?.data?.message || "Failed to link document to slot")
            }
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'LINKED':
                return {
                    label: 'Already Provided',
                    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    icon: Link2,
                    iconColor: 'text-blue-600'
                }
            case 'REQUESTED':
                return {
                    label: 'Pending Upload',
                    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    icon: Upload,
                    iconColor: 'text-orange-600'
                }
            case 'UPLOADED':
                return {
                    label: 'Uploaded - Under Review',
                    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    icon: Clock,
                    iconColor: 'text-yellow-600'
                }
            case 'APPROVED':
                return {
                    label: 'Approved',
                    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    icon: FileCheck,
                    iconColor: 'text-green-600'
                }
            case 'REJECTED':
                return {
                    label: 'Re-upload Required',
                    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    icon: AlertCircle,
                    iconColor: 'text-red-600'
                }
            default:
                return {
                    label: status,
                    color: 'bg-gray-100 text-gray-800',
                    icon: File,
                    iconColor: 'text-gray-600'
                }
        }
    }

    const getPriorityBadge = (priority: string | null) => {
        if (!priority || priority === 'NORMAL') return null
        if (priority === 'HIGH') {
            return <Badge variant="destructive" className="text-xs">High Priority</Badge>
        }
        return <Badge variant="secondary" className="text-xs">Low Priority</Badge>
    }

    // Group slots by status
    const linkedSlots = slots.filter(s => s.status === 'LINKED')
    const pendingSlots = slots.filter(s => ['REQUESTED', 'REJECTED'].includes(s.status))
    const reviewSlots = slots.filter(s => s.status === 'UPLOADED')
    const approvedSlots = slots.filter(s => s.status === 'APPROVED')

    if (loading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <span className="ml-2 text-gray-500">Loading document requirements...</span>
                </CardContent>
            </Card>
        )
    }

    if (slots.length === 0) {
        return null // No slots to show
    }

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <File className="h-5 w-5 text-violet-600" />
                        Required Documents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Pending Uploads - Most Important Section */}
                    {pendingSlots.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Action Required ({pendingSlots.length})
                            </h3>
                            <div className="space-y-3">
                                {pendingSlots.map(slot => {
                                    const config = getStatusConfig(slot.status)
                                    const StatusIcon = config.icon
                                    const isRejected = slot.status === 'REJECTED'

                                    return (
                                        <div
                                            key={slot.id}
                                            className={`p-4 rounded-lg border-2 ${isRejected
                                                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                                                    : 'border-orange-200 bg-orange-50 dark:bg-orange-900/20'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
                                                        <span className="font-medium">{slot.documentName}</span>
                                                        {slot.isRequired && (
                                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                                        )}
                                                        {getPriorityBadge(slot.priority)}
                                                    </div>

                                                    {isRejected && slot.rejectionReason && (
                                                        <div className="mt-2 p-2 rounded bg-red-100 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300">
                                                            <strong>Reason for rejection:</strong> {slot.rejectionReason}
                                                        </div>
                                                    )}

                                                    {slot.requestMessage && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {slot.requestMessage}
                                                        </p>
                                                    )}

                                                    {slot.deadline && (
                                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Deadline: {formatDate(slot.deadline)}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-violet-600 hover:bg-violet-700"
                                                    onClick={() => {
                                                        setUploadSlotId(slot.id)
                                                        setUploadSlotName(slot.documentName)
                                                    }}
                                                >
                                                    <Upload className="h-4 w-4 mr-1" />
                                                    {isRejected ? 'Re-upload' : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Under Review */}
                    {reviewSlots.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Under Review ({reviewSlots.length})
                            </h3>
                            <div className="space-y-2">
                                {reviewSlots.map(slot => (
                                    <div key={slot.id} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                                <span className="font-medium">{slot.documentName}</span>
                                            </div>
                                            {slot.uploadedDocument && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <File className="h-4 w-4" />
                                                    {slot.uploadedDocument.fileName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Already Provided (Linked) */}
                    {linkedSlots.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                Already Provided ({linkedSlots.length})
                            </h3>
                            <div className="space-y-2">
                                {linkedSlots.map(slot => (
                                    <div key={slot.id} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium">{slot.documentName}</span>
                                                <Badge className={getStatusConfig('LINKED').color}>
                                                    No action needed
                                                </Badge>
                                            </div>
                                            {slot.linkedDocument && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <File className="h-4 w-4" />
                                                    {slot.linkedDocument.fileName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approved */}
                    {approvedSlots.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                                <FileCheck className="h-4 w-4" />
                                Approved ({approvedSlots.length})
                            </h3>
                            <div className="space-y-2">
                                {approvedSlots.map(slot => (
                                    <div key={slot.id} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileCheck className="h-4 w-4 text-green-600" />
                                                <span className="font-medium">{slot.documentName}</span>
                                                <Badge className={getStatusConfig('APPROVED').color}>
                                                    Approved
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={!!uploadSlotId} onOpenChange={(open) => !open && setUploadSlotId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload: {uploadSlotName}</DialogTitle>
                    </DialogHeader>
                    <DocumentUpload
                        onUploadSuccess={handleUploadSuccess}
                        serviceId={serviceId}
                        documentType={uploadSlotName}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
