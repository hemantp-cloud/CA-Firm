"use client"

import { useState, useEffect } from "react"
import { Search, Briefcase, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import api from "@/lib/api"

interface Service {
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
    createdAt: string
    client: {
        id: string
        name: string
        email: string
    }
}

export default function TeamMemberServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/team-member/services")
            if (response.data.success) {
                setServices(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch services:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle2 className="h-4 w-4" />
            case "IN_PROGRESS": return <Clock className="h-4 w-4" />
            case "PENDING": return <AlertCircle className="h-4 w-4" />
            case "CANCELLED": return <XCircle className="h-4 w-4" />
            default: return null
        }
    }

    const filteredServices = services.filter((service) => {
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const matchesSearch =
                service.title.toLowerCase().includes(query) ||
                service.type.toLowerCase().includes(query) ||
                service.client.name.toLowerCase().includes(query)
            if (!matchesSearch) return false
        }

        // Status filter
        if (statusFilter !== "all" && service.status !== statusFilter) {
            return false
        }

        return true
    })

    // Calculate stats
    const stats = {
        total: services.length,
        pending: services.filter(s => s.status === "PENDING").length,
        inProgress: services.filter(s => s.status === "IN_PROGRESS").length,
        completed: services.filter(s => s.status === "COMPLETED").length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage services for your assigned clients
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                <p className="text-xs text-gray-500">Total Services</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                                <p className="text-xs text-gray-500">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                                <p className="text-xs text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                                <p className="text-xs text-gray-500">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Search services by title, type, or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Services Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                    <h2 className="text-xl font-semibold">
                        Services ({filteredServices.length})
                    </h2>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading services...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchQuery || statusFilter !== "all"
                                    ? "No services match your filter"
                                    : "No services found"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-slate-800">
                                        <TableHead className="font-semibold">Service</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Client</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold">Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-gray-900 dark:text-white">
                                                {service.title}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{service.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/team-member/clients/${service.client.id}`}
                                                    className="text-teal-600 hover:text-teal-800 hover:underline"
                                                >
                                                    {service.client.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`${getStatusColor(service.status)} inline-flex items-center gap-1`}>
                                                    {getStatusIcon(service.status)}
                                                    {service.status.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {service.dueDate
                                                    ? new Date(service.dueDate).toLocaleDateString()
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
