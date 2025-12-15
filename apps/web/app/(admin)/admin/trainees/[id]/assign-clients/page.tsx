"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, Loader2, Search, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
}

interface AssignedClient {
    assignmentId: string
    client: Client
}

export default function AssignClientsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: traineeId } = use(params)
    const [trainee, setTrainee] = useState<any>(null)
    const [allClients, setAllClients] = useState<Client[]>([])
    const [assignedClientIds, setAssignedClientIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchData()
    }, [traineeId])

    const fetchData = async () => {
        try {
            setIsLoading(true)

            // Fetch trainee details
            const traineeResponse = await api.get(`/trainees/${traineeId}`)
            if (traineeResponse.data.success) {
                setTrainee(traineeResponse.data.data)

                // Extract assigned client IDs
                const assigned = new Set<string>(
                    traineeResponse.data.data.assignedClients?.map((ac: AssignedClient) => ac.client.id) || []
                )
                setAssignedClientIds(assigned)
            }

            // Fetch all clients (assuming there's an admin endpoint to get all clients)
            // For now, we'll use the CA clients endpoint - you may need to adjust this
            const clientsResponse = await api.get("/admin/client")
            if (clientsResponse.data.success) {
                setAllClients(clientsResponse.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleClient = (clientId: string) => {
        const newSet = new Set(assignedClientIds)
        if (newSet.has(clientId)) {
            newSet.delete(clientId)
        } else {
            newSet.add(clientId)
        }
        setAssignedClientIds(newSet)
    }

    const handleSelectAll = () => {
        const activeClients = allClients.filter(c => c.isActive)
        if (assignedClientIds.size === activeClients.length) {
            // Deselect all
            setAssignedClientIds(new Set())
        } else {
            // Select all active clients
            setAssignedClientIds(new Set(activeClients.map(c => c.id)))
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            // Get the original assigned client IDs from the trainee data
            const originalAssignedIds = new Set<string>(
                trainee?.assignedClients?.map((ac: AssignedClient) => ac.client.id) || []
            )

            // Find clients to assign (new ones)
            const toAssign = Array.from(assignedClientIds).filter((id: string) => !originalAssignedIds.has(id))

            // Find clients to unassign (removed ones)
            const toUnassign = Array.from(originalAssignedIds).filter((id: string) => !assignedClientIds.has(id))

            // Assign new clients
            if (toAssign.length > 0) {
                await api.post(`/trainees/${traineeId}/assign-clients`, {
                    clientIds: toAssign,
                })
            }

            // Unassign removed clients
            if (toUnassign.length > 0) {
                await api.post(`/trainees/${traineeId}/unassign-clients`, {
                    clientIds: toUnassign,
                })
            }

            alert("Client assignments updated successfully")
            fetchData() // Refresh data
        } catch (error) {
            console.error("Failed to save assignments:", error)
            alert("Failed to update assignments. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const filteredClients = allClients.filter((client) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            client.name.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query)
        )
    })

    const activeClients = filteredClients.filter(c => c.isActive)
    const allActiveSelected = activeClients.length > 0 && activeClients.every(c => assignedClientIds.has(c.id))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/trainees">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assign Clients</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {trainee ? `Assign clients to ${trainee.name}` : "Loading..."}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Assignments
                        </>
                    )}
                </Button>
            </div>

            {/* Search and Stats */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Search clients by name, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="secondary">
                                {assignedClientIds.size} / {activeClients.length} Selected
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Clients List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Select Clients to Assign
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={isLoading || activeClients.length === 0}
                        >
                            {allActiveSelected ? "Deselect All" : "Select All"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            <p className="mt-2 text-gray-500">Loading clients...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No clients found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className={`flex items-center space-x-3 p-4 rounded-lg border ${assignedClientIds.has(client.id)
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        } ${!client.isActive ? "opacity-50" : ""}`}
                                >
                                    <Checkbox
                                        id={`client-${client.id}`}
                                        checked={assignedClientIds.has(client.id)}
                                        onCheckedChange={() => handleToggleClient(client.id)}
                                        disabled={!client.isActive}
                                    />
                                    <label
                                        htmlFor={`client-${client.id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {client.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {client.email && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            📧 {client.email}
                                                        </span>
                                                    )}
                                                    {client.phone && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            📞 {client.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                {!client.isActive && (
                                                    <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                    <Link href="/admin/trainees">Cancel</Link>
                </Button>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Assignments ({assignedClientIds.size} clients)
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
