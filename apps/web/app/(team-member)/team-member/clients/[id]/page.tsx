"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, User, Mail, Phone, Building2, Briefcase, FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    pan: string | null
    address: string | null
    businessName: string | null
    gstin: string | null
    isActive: boolean
    createdAt: string
}

interface Service {
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [client, setClient] = useState<Client | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchClientData()
    }, [id])

    const fetchClientData = async () => {
        try {
            setIsLoading(true)

            // Fetch all clients and filter for this one
            const clientsResponse = await api.get("/team-member/clients")
            if (clientsResponse.data.success) {
                const foundClient = clientsResponse.data.data.find((c: any) => c.id === id)
                if (foundClient) {
                    setClient(foundClient)
                }
            }

            // Fetch services for this client
            const servicesResponse = await api.get("/team-member/services")
            if (servicesResponse.data.success) {
                const clientServices = servicesResponse.data.data.filter(
                    (s: any) => s.client?.id === id || s.clientId === id
                )
                setServices(clientServices)
            }
        } catch (error) {
            console.error("Failed to fetch client data:", error)
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <User className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Client Not Found</h2>
                <p className="text-gray-500 mb-4">This client may not be assigned to you</p>
                <Button asChild>
                    <Link href="/team-member/clients">Back to Clients</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/team-member/clients">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Client Details
                    </p>
                </div>
                <Badge className={client.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800"
                }>
                    {client.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                <p className="text-gray-900 dark:text-white font-medium">{client.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-gray-900 dark:text-white">{client.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                                <p className="text-gray-900 dark:text-white">{client.phone || "-"}</p>
                            </div>
                        </div>

                        {client.address && (
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-gray-900 dark:text-white">{client.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Business Information */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Business Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Name</p>
                                <p className="text-gray-900 dark:text-white">{client.businessName || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN</p>
                                <p className="text-gray-900 dark:text-white">{client.pan || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">GSTIN</p>
                                <p className="text-gray-900 dark:text-white">{client.gstin || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(client.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Services ({services.length})
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                        All services for this client
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {services.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No services found for this client</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-slate-800">
                                    <TableHead className="font-semibold">Service Title</TableHead>
                                    <TableHead className="font-semibold">Type</TableHead>
                                    <TableHead className="font-semibold text-center">Status</TableHead>
                                    <TableHead className="font-semibold">Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium text-gray-900 dark:text-white">
                                            {service.title}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            {service.type}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getStatusColor(service.status)}>
                                                {service.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            {service.dueDate
                                                ? new Date(service.dueDate).toLocaleDateString()
                                                : "-"
                                            }
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
