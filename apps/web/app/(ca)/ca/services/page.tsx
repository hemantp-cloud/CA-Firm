"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, LayoutGrid, Table as TableIcon, Search, Filter, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"
import ServicesKanbanBoard from "@/components/services/ServicesKanbanBoard"

interface Service {
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
    feeAmount: number | null
    user: {
        id: string
        name: string
    }
    client: {
        id: string
        name: string
    } | null
}

interface User {
    id: string
    name: string
}

type ViewMode = "kanban" | "table"

export default function CaServicesPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("kanban")
    const [services, setServices] = useState<Service[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [userFilter, setUserFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState<string>("")
    const [dateTo, setDateTo] = useState<string>("")

    useEffect(() => {
        fetchServices()
        fetchUsers()
    }, [userFilter, typeFilter, statusFilter, dateFrom, dateTo])

    const fetchServices = async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()
            if (userFilter !== "all") params.append("userId", userFilter)
            if (typeFilter !== "all") params.append("type", typeFilter)
            if (statusFilter !== "all") params.append("status", statusFilter)
            if (dateFrom) params.append("dateFrom", dateFrom)
            if (dateTo) params.append("dateTo", dateTo)

            const response = await api.get(`/ca/services?${params.toString()}`)
            if (response.data.success) {
                setServices(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch services:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await api.get("/ca/clients")
            if (response.data.success) {
                setUsers(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
        }
    }

    const handleStatusUpdate = useCallback(async (serviceId: string, newStatus: string) => {
        try {
            await api.patch(`/services/${serviceId}/status`, { status: newStatus })
            fetchServices()
        } catch (error) {
            console.error("Failed to update service status:", error)
        }
    }, [])

    const filteredServices = services.filter((service) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            service.title.toLowerCase().includes(query) ||
            service.user.name.toLowerCase().includes(query)
        )
    })

    const formatCurrency = (amount: number | null) => {
        if (!amount) return "-"
        return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage services for your customers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === "kanban" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("kanban")}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Kanban
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("table")}
                        >
                            <TableIcon className="h-4 w-4 mr-2" />
                            Table
                        </Button>
                    </div>
                    <Button asChild>
                        <Link href="/ca/services/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* User Filter */}
                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Service Type Filter */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="ITR_FILING">ITR Filing</SelectItem>
                                <SelectItem value="GST_REGISTRATION">GST Registration</SelectItem>
                                <SelectItem value="GST_RETURN">GST Return</SelectItem>
                                <SelectItem value="TDS_RETURN">TDS Return</SelectItem>
                                <SelectItem value="TDS_COMPLIANCE">TDS Compliance</SelectItem>
                                <SelectItem value="ROC_FILING">ROC Filing</SelectItem>
                                <SelectItem value="AUDIT">Audit</SelectItem>
                                <SelectItem value="BOOK_KEEPING">Book Keeping</SelectItem>
                                <SelectItem value="PAYROLL">Payroll</SelectItem>
                                <SelectItem value="CONSULTATION">Consultation</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Date From */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="From Date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Date To */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="To Date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">Loading services...</p>
                    </CardContent>
                </Card>
            ) : viewMode === "kanban" ? (
                <ServicesKanbanBoard
                    services={filteredServices}
                    onStatusUpdate={handleStatusUpdate}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            All Services ({filteredServices.length})
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-gray-500 dark:text-gray-400">No services found</p>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href="/ca/services/new">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Your First Service
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredServices.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/ca/services/${service.id}`}
                                                    className="hover:underline text-blue-600 dark:text-blue-400"
                                                >
                                                    {service.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{formatServiceType(service.type)}</TableCell>
                                            <TableCell>{service.user.name}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(service.status)}>
                                                    {formatStatus(service.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(service.dueDate)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(service.feeAmount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/ca/services/${service.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
