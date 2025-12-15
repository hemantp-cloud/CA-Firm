"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    address: string | null
    pan: string | null
    isActive: boolean
    servicesCount?: number
    documentsCount?: number
}

export default function TraineeClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [client, setClient] = useState<Client | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchClient()
    }, [id])

    const fetchClient = async () => {
        try {
            setIsLoading(true)
            // Fetch client details - trainees should only be able to view assigned clients
            const response = await api.get(`/client/${id}`)
            if (response.data.success) {
                setClient(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch client:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Loading client details...</p>
                </div>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Client not found or not assigned to you</p>
                    <Button asChild className="mt-4">
                        <Link href="/trainee/clients">Back to Clients</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/trainee/clients">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Client Details</p>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div>
                <Badge
                    className={
                        client.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }
                >
                    {client.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-white">{client.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="text-gray-900 dark:text-white">{client.phone || "-"}</p>
                            </div>
                        </div>

                        {client.address && (
                            <div className="flex items-start gap-3 md:col-span-2">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-gray-900 dark:text-white">{client.address}</p>
                                </div>
                            </div>
                        )}

                        {client.pan && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN</p>
                                    <p className="text-gray-900 dark:text-white">{client.pan}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Services
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {client.servicesCount || 0}
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
                                    Documents
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {client.documentsCount || 0}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Information */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Information</h2>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            This client has been assigned to you for management. You can view their services and documents
                            in the respective sections.
                        </p>
                        <p className="mt-2">
                            For any questions or issues, please contact your supervisor or the CA managing this client.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
