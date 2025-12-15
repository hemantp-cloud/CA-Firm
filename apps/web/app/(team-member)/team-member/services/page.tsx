"use client"

import { useState, useEffect } from "react"
import { Search, Briefcase } from "lucide-react"
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
import Link from "next/link"
import api from "@/lib/api"
import { useSession } from "next-auth/react"

interface Service {
    id: string
    name: string
    type: string
    status: string
    dueDate: string | null
    client: {
        id: string
        name: string
    }
}

export default function TeamMemberServicesPage() {
    const { data: session } = useSession()
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchServices()
    }, [session])

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

    const filteredServices = services.filter((service) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            service.name.toLowerCase().includes(query) ||
            service.type.toLowerCase().includes(query) ||
            service.client.name.toLowerCase().includes(query)
        )
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage services for your assigned clients
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        All Services ({filteredServices.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading services...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No services found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>{service.type}</TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/team-member/clients/${service.client.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {service.client.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{service.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {service.dueDate
                                                ? new Date(service.dueDate).toLocaleDateString()
                                                : "-"}
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
