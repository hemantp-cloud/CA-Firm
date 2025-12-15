"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Users, Briefcase, FileText, Clock, ArrowRight, Eye } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
}

interface Service {
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
    client: {
        id: string
        name: string
        email: string
    }
}

interface DashboardData {
    assignedClients: number
    activeServices: number
    pendingTasks: number
    totalDocuments: number
    recentClients: Client[]
    recentServices: Service[]
}

export default function TeamMemberDashboard() {
    const { data: session } = useSession()
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        assignedClients: 0,
        activeServices: 0,
        pendingTasks: 0,
        totalDocuments: 0,
        recentClients: [],
        recentServices: [],
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)

            // Fetch clients
            const clientsResponse = await api.get("/team-member/clients")
            const clients = clientsResponse.data.success ? clientsResponse.data.data : []

            // Fetch services
            const servicesResponse = await api.get("/team-member/services")
            const services = servicesResponse.data.success ? servicesResponse.data.data : []

            // Calculate stats
            const activeServices = services.filter((s: Service) =>
                s.status === "IN_PROGRESS" || s.status === "PENDING"
            ).length

            const pendingTasks = services.filter((s: Service) =>
                s.status === "PENDING"
            ).length

            setDashboardData({
                assignedClients: clients.length,
                activeServices: activeServices,
                pendingTasks: pendingTasks,
                totalDocuments: 0, // Will be fetched from documents API if available
                recentClients: clients.slice(0, 5),
                recentServices: services.slice(0, 5),
            })
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
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

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Welcome back, {session?.user?.name || "Team Member"}! 👋
                        </h1>
                        <p className="text-teal-100 mt-1">
                            Here's an overview of your assigned clients and tasks
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="text-sm font-medium">Team Member Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Assigned Clients
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {isLoading ? "-" : dashboardData.assignedClients}
                                </p>
                            </div>
                            <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <Link href="/team-member/clients" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Active Services
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {isLoading ? "-" : dashboardData.activeServices}
                                </p>
                            </div>
                            <div className="h-14 w-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <Briefcase className="h-7 w-7 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <Link href="/team-member/services" className="text-sm text-green-600 hover:text-green-800 mt-4 inline-flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Pending Tasks
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {isLoading ? "-" : dashboardData.pendingTasks}
                                </p>
                            </div>
                            <div className="h-14 w-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <Clock className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Documents
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {isLoading ? "-" : dashboardData.totalDocuments}
                                </p>
                            </div>
                            <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <FileText className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <Link href="/team-member/documents" className="text-sm text-purple-600 hover:text-purple-800 mt-4 inline-flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-teal-600">+</span> Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/team-member/clients">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">View Clients</h3>
                                        <p className="text-blue-100 text-sm">See all assigned clients</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/team-member/services">
                        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">View Services</h3>
                                        <p className="text-green-100 text-sm">Manage service requests</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/team-member/documents">
                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Documents</h3>
                                        <p className="text-purple-100 text-sm">View and upload files</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/team-member/settings">
                        <Card className="bg-gradient-to-br from-gray-600 to-gray-700 border-0 cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Eye className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">My Profile</h3>
                                        <p className="text-gray-200 text-sm">View your profile</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Recent Clients & Recent Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Clients */}
                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Clients
                        </h2>
                        <Link href="/team-member/clients">
                            <Button variant="ghost" size="sm" className="text-teal-600">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-gray-500 text-center py-4">Loading...</p>
                        ) : dashboardData.recentClients.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No clients assigned yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboardData.recentClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                                                <span className="text-teal-700 dark:text-teal-300 font-semibold text-sm">
                                                    {client.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <Link href={`/team-member/clients/${client.id}`} className="font-medium text-gray-900 dark:text-white hover:text-teal-600">
                                                    {client.name}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                                            </div>
                                        </div>
                                        <Badge className={client.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                            {client.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Services */}
                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Services
                        </h2>
                        <Link href="/team-member/services">
                            <Button variant="ghost" size="sm" className="text-teal-600">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-gray-500 text-center py-4">Loading...</p>
                        ) : dashboardData.recentServices.length === 0 ? (
                            <div className="text-center py-8">
                                <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No services found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboardData.recentServices.map((service) => (
                                    <div
                                        key={service.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{service.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {service.client.name} • {service.type}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(service.status)}>
                                            {service.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
