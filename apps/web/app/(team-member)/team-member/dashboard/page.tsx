"use client"

import { useState, useEffect } from "react"
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react"
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

interface AssignedClient {
    assignmentId: string
    client: {
        id: string
        name: string
        email: string
        phone: string | null
        isActive: boolean
        servicesCount: number
        documentsCount: number
    }
    assignedBy: {
        id: string
        name: string
        email: string
    }
    assignedAt: string
    notes: string | null
}

export default function TeamMemberDashboard() {
    const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)

            // Get current user's ID from session/token
            const userResponse = await api.get("/auth/me")
            const currentUser = userResponse.data?.data

            if (currentUser?.id) {
                // Fetch assigned clients
                const clientsResponse = await api.get(`/team-member/assigned-clients`)
                if (clientsResponse.data.success) {
                    setAssignedClients(clientsResponse.data.data)
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const stats = {
        totalClients: assignedClients.length,
        activeClients: assignedClients.filter(ac => ac.client.isActive).length,
        totalServices: assignedClients.reduce((sum, ac) => sum + (ac.client.servicesCount || 0), 0),
        totalDocuments: assignedClients.reduce((sum, ac) => sum + (ac.client.documentsCount || 0), 0),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Welcome to your Team Member portal. Manage your assigned clients.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Assigned Clients
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats.totalClients}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Active Clients
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats.activeClients}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Services
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats.totalServices}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Documents
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats.totalDocuments}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assigned Clients Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        My Assigned Clients ({assignedClients.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading your assigned clients...</p>
                        </div>
                    ) : assignedClients.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 mb-2">No clients assigned yet</p>
                            <p className="text-sm text-gray-400">
                                Contact your supervisor to get clients assigned
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead>Documents</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedClients.map((assignment) => (
                                    <TableRow key={assignment.assignmentId}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/team-member/clients/${assignment.client.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {assignment.client.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{assignment.client.email}</TableCell>
                                        <TableCell>{assignment.client.phone || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{assignment.client.servicesCount || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{assignment.client.documentsCount || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    assignment.client.isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {assignment.client.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {assignment.assignedBy.name}
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
