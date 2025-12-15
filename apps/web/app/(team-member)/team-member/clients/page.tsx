"use client"

import { useState, useEffect } from "react"
import { Search, Users } from "lucide-react"
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

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
    servicesCount: number
    documentsCount: number
}

export default function TeamMemberClientsPage() {
    const { data: session } = useSession()
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchClients()
    }, [session])

    const fetchClients = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/team-member/clients")
            if (response.data.success) {
                setClients(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch clients:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredClients = clients.filter((client) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Clients</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View and manage your assigned clients
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search clients..."
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
                        Assigned Clients ({filteredClients.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading clients...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No clients assigned yet</p>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/team-member/clients/${client.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {client.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.phone || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{client.servicesCount || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{client.documentsCount || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    client.isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {client.isActive ? "Active" : "Inactive"}
                                            </Badge>
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
