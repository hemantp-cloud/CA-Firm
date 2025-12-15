"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Search,
    Filter,
    Loader2,
    Briefcase,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Eye,
    Building2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { StatusBadge, StatusProgressBar } from "@/components/services/StatusTimeline"
import {
    ServiceStatus,
    ServiceType,
    SERVICE_TYPE_LABELS
} from "@/types/service-workflow"

interface Service {
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
    feeAmount: number | null
    financialYear: string | null
    currentAssigneeName: string | null
    client: {
        id: string
        name: string
    }
}

export default function SuperAdminServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            setIsLoading(true)
            const response = await api.get('/admin/services')
            if (response.data.success) {
                setServices(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch services:", error)
            toast.error("Failed to load services")
        } finally {
            setIsLoading(false)
        }
    }

    // Filter services
    const filteredServices = services.filter(service => {
        if (statusFilter !== 'all' && service.status !== statusFilter) return false
        if (typeFilter !== 'all' && service.type !== typeFilter) return false
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            return (
                service.title.toLowerCase().includes(search) ||
                service.client?.name.toLowerCase().includes(search) ||
                service.currentAssigneeName?.toLowerCase().includes(search)
            )
        }
        return true
    })

    // Stats
    const stats = {
        total: services.length,
        pending: services.filter(s => s.status === 'PENDING').length,
        inProgress: services.filter(s => ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(s.status)).length,
        completed: services.filter(s => ['COMPLETED', 'DELIVERED', 'INVOICED', 'CLOSED'].includes(s.status)).length,
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
        return `₹${amount.toLocaleString("en-IN")}`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        All Services
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage all services across the firm
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin/services/requests">
                            <Clock className="h-4 w-4 mr-2" />
                            Pending Requests
                        </Link>
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                        <Link href="/super-admin/services/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Service
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                <p className="text-xs text-gray-500">Total Services</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                                <p className="text-xs text-gray-500">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                                <p className="text-xs text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                                <p className="text-xs text-gray-500">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search services, clients, assignees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_FOR_CLIENT">Waiting for Client</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="INVOICED">Invoiced</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Services Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle>Services ({filteredServices.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="text-gray-500 mt-2">Loading services...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="py-12 text-center">
                            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No services found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Fee</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{service.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <span>{service.client?.name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={service.status as ServiceStatus} />
                                        </TableCell>
                                        <TableCell className="w-32">
                                            <StatusProgressBar status={service.status as ServiceStatus} />
                                        </TableCell>
                                        <TableCell>
                                            {service.currentAssigneeName || <span className="text-gray-400">Unassigned</span>}
                                        </TableCell>
                                        <TableCell>{formatDate(service.dueDate)}</TableCell>
                                        <TableCell>{formatCurrency(service.feeAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/super-admin/services/${service.id}`}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
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
