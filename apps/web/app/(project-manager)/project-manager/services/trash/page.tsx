"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Trash2,
    RotateCcw,
    AlertTriangle,
    Loader2,
    FileText,
    Clock,
    User,
    Calendar,
    X
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"

interface DeletedService {
    id: string
    title: string
    type: string
    status: string
    deletedAt: string
    deletedBy: string | null
    deletedByName: string | null
    createdAt: string
    dueDate: string | null
    client: {
        id: string
        name: string
    }
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
    ITR_FILING: "ITR Filing",
    GST_REGISTRATION: "GST Registration",
    GST_RETURN: "GST Return",
    TDS_RETURN: "TDS Return",
    TDS_COMPLIANCE: "TDS Compliance",
    ROC_FILING: "ROC Filing",
    AUDIT: "Audit",
    BOOK_KEEPING: "Book Keeping",
    PAYROLL: "Payroll",
    CONSULTATION: "Consultation",
    OTHER: "Other",
}

export default function TrashPage() {
    const router = useRouter()
    const [deletedServices, setDeletedServices] = useState<DeletedService[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
    const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
    const [selectedService, setSelectedService] = useState<DeletedService | null>(null)
    const [confirmText, setConfirmText] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        fetchDeletedServices()
    }, [])

    const fetchDeletedServices = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/project-manager/services/trash")
            if (response.data.success) {
                setDeletedServices(response.data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch deleted services:", error)
            toast.error("Failed to load deleted services")
        } finally {
            setIsLoading(false)
        }
    }

    const openRestoreDialog = (service: DeletedService) => {
        setSelectedService(service)
        setRestoreDialogOpen(true)
    }

    const openPermanentDeleteDialog = (service: DeletedService) => {
        setSelectedService(service)
        setConfirmText("")
        setPermanentDeleteDialogOpen(true)
    }

    const handleRestore = async () => {
        if (!selectedService) return

        try {
            setIsProcessing(true)
            const response = await api.post(`/project-manager/services/${selectedService.id}/restore`)
            if (response.data.success) {
                toast.success("Service restored successfully")
                setRestoreDialogOpen(false)
                setSelectedService(null)
                fetchDeletedServices()
            }
        } catch (error: any) {
            console.error("Failed to restore service:", error)
            toast.error(error.response?.data?.message || "Failed to restore service")
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePermanentDelete = async () => {
        if (!selectedService || confirmText !== "PERMANENTLY DELETE") return

        try {
            setIsProcessing(true)
            const response = await api.delete(`/project-manager/services/${selectedService.id}/permanent`)
            if (response.data.success) {
                toast.success("Service permanently deleted")
                setPermanentDeleteDialogOpen(false)
                setSelectedService(null)
                setConfirmText("")
                fetchDeletedServices()
            }
        } catch (error: any) {
            console.error("Failed to permanently delete service:", error)
            toast.error(error.response?.data?.message || "Failed to permanently delete service")
        } finally {
            setIsProcessing(false)
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

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/project-manager/services">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Services
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Trash2 className="h-8 w-8 text-gray-500" />
                            Deleted Services
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {deletedServices.length} service{deletedServices.length !== 1 ? 's' : ''} in trash
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Items in trash can be restored or permanently deleted
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Permanently deleted services cannot be recovered.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Deleted Services List */}
            {deletedServices.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Trash2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            Trash is empty
                        </h3>
                        <p className="text-gray-500 mt-2">
                            No deleted services found. When you delete services, they will appear here.
                        </p>
                        <Button variant="outline" className="mt-4" asChild>
                            <Link href="/project-manager/services">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Services
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            Deleted Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Deleted</TableHead>
                                    <TableHead>Deleted By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deletedServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium">{service.title}</div>
                                            <div className="text-xs text-gray-500">
                                                Status: {service.status}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {service.client?.name || "Unknown"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {SERVICE_TYPE_LABELS[service.type] || service.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                {formatDateTime(service.deletedAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {service.deletedByName || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openRestoreDialog(service)}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openPermanentDeleteDialog(service)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Restore Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-green-600" />
                            Restore Service
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore this service?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedService && (
                        <div className="py-4">
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{selectedService.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="h-4 w-4" />
                                    {selectedService.client?.name}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                The service will be restored with status: <Badge>PENDING</Badge>
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestore}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore Service
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permanent Delete Dialog */}
            <Dialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Permanently Delete Service
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The service and all its data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedService && (
                        <div className="py-4 space-y-4">
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-red-500" />
                                    <span className="font-medium text-red-700 dark:text-red-300">
                                        {selectedService.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-1">
                                    <User className="h-4 w-4" />
                                    {selectedService.client?.name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmText">
                                    Type <span className="font-mono font-bold">PERMANENTLY DELETE</span> to confirm:
                                </Label>
                                <Input
                                    id="confirmText"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="PERMANENTLY DELETE"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setPermanentDeleteDialogOpen(false)
                            setConfirmText("")
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePermanentDelete}
                            disabled={isProcessing || confirmText !== "PERMANENTLY DELETE"}
                            variant="destructive"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Permanently Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
