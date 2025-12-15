"use client"

import { useState, useEffect } from "react"
import { Search, Users, Eye, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    isActive: boolean
    servicesCount?: number
    documentsCount?: number
}

export default function TeamMemberClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchClients()
    }, [])

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Clients</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage your assigned clients
                    </p>
                </div>
                <Badge variant="outline" className="w-fit text-base px-4 py-2">
                    <Users className="h-4 w-4 mr-2" />
                    {clients.length} Client{clients.length !== 1 ? 's' : ''} Assigned
                </Badge>
            </div>

            {/* Search */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search clients by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Clients Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
                    <h2 className="text-xl font-semibold">
                        Assigned Clients ({filteredClients.length})
                    </h2>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading clients...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                                {searchQuery ? "No clients match your search" : "No clients assigned yet"}
                            </p>
                            <p className="text-sm text-gray-400">
                                {!searchQuery && "Contact your supervisor to get clients assigned"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-slate-800">
                                        <TableHead className="font-semibold">Client</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">Phone</TableHead>
                                        <TableHead className="font-semibold text-center">Services</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => (
                                        <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                        <span className="text-teal-700 dark:text-teal-300 font-semibold">
                                                            {client.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/team-member/clients/${client.id}`}
                                                        className="font-medium text-gray-900 dark:text-white hover:text-teal-600 transition-colors"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {client.email}
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {client.phone || "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">
                                                    {client.servicesCount || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={
                                                        client.isActive
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                    }
                                                >
                                                    {client.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/team-member/clients/${client.id}`}>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Link>
                                                </Button>
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
