"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, User, Calendar, FileText, DollarSign } from "lucide-react"
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
    completedAt: string | null
    feeAmount: number | null
    notes: string | null
    financialYear: string | null
    period: string | null
    user: {
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

export default function CaServiceDetailsPage() {
    const params = useParams()
    const router = useRouter()
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
            const response = await api.get(`/services/${serviceId}`)
            if (response.data.success) {
                setService(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch service:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this service?")) {
            return
        }

        try {
            await api.delete(`/services/${serviceId}`)
            router.push("/ca/services")
        } catch (error) {
            console.error("Failed to delete service:", error)
            alert("Failed to delete service")
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
            CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        }
        return colors[status] || colors.PENDING
    }

    const formatServiceType = (type: string) => {
        return type
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ")
    }

    const formatCurrency = (amount: number | null) => {
        if (!amount) return "-"
        return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
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
                    <Link href="/ca/services">Back to Services</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/ca/services">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{service.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Service details and information</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/ca/services/${serviceId}/edit`}>
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

            {/* Service Information */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Information</h2>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Service Name</p>
                            <p className="font-medium text-gray-900 dark:text-white flex-1">{service.title}</p>
                        </div>

                        <div className="flex items-start gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Type</p>
                            <Badge variant="outline">{formatServiceType(service.type)}</Badge>
                        </div>

                        <div className="flex items-start gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Status</p>
                            <Badge className={getStatusColor(service.status)}>
                                {formatStatus(service.status)}
                            </Badge>
                        </div>

                        {service.financialYear && (
                            <div className="flex items-start gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Financial Year</p>
                                <p className="font-medium text-gray-900 dark:text-white flex-1">
                                    {service.financialYear}
                                </p>
                            </div>
                        )}

                        {service.period && (
                            <div className="flex items-start gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Period</p>
                                <p className="font-medium text-gray-900 dark:text-white flex-1">{service.period}</p>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(service.dueDate)}
                                </p>
                            </div>
                        </div>

                        {service.completedAt && (
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed At</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {formatDate(service.completedAt)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                                <p className="font-medium text-gray-900 dark:text-white">{service.user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{service.user.email}</p>
                            </div>
                        </div>

                        {service.feeAmount && (
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(service.feeAmount)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {service.description && (
                            <div className="flex items-start gap-3 md:col-span-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 w-32">Description</p>
                                <p className="text-gray-900 dark:text-white flex-1">{service.description}</p>
                            </div>
                        )}

                        {service.notes && (
                            <div className="flex items-start gap-3 md:col-span-2">
                                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Internal Notes</p>
                                    <p className="text-gray-900 dark:text-white">{service.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Tasks ({service.tasks.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {service.tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No tasks found for this service
                        </div>
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
                                            <Badge className={getStatusColor(task.status)}>
                                                {formatStatus(task.status)}
                                            </Badge>
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
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Documents ({service.documents.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {service.documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No documents found for this service
                        </div>
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
    )
}
