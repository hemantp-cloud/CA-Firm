"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Loader2, Check, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
}

interface TeamMember {
    id: string
    name: string
    email: string
    assignedClients?: Array<{
        client: Client
    }>
}

export default function AssignClientsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
    const [allClients, setAllClients] = useState<Client[]>([])
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
    const [initiallyAssigned, setInitiallyAssigned] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setIsLoading(true)

            // Fetch team member details with assigned clients
            const tmResponse = await api.get(`/project-manager/team-members/${id}`)
            if (tmResponse.data.success) {
                setTeamMember(tmResponse.data.data)
                const assignedIds = new Set(
                    (tmResponse.data.data.assignedClients || []).map((a: any) => a.client.id)
                )
                setSelectedClients(assignedIds)
                setInitiallyAssigned(assignedIds)
            }

            // Fetch all clients
            const clientsResponse = await api.get("/project-manager/clients")
            if (clientsResponse.data.success) {
                setAllClients(clientsResponse.data.data.filter((c: Client) => c.isActive))
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleClient = (clientId: string) => {
        const newSelected = new Set(selectedClients)
        if (newSelected.has(clientId)) {
            newSelected.delete(clientId)
        } else {
            newSelected.add(clientId)
        }
        setSelectedClients(newSelected)
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            // Find clients to assign (in selected but not in initially assigned)
            const toAssign = [...selectedClients].filter(id => !initiallyAssigned.has(id))

            // Find clients to unassign (in initially assigned but not in selected)
            const toUnassign = [...initiallyAssigned].filter(id => !selectedClients.has(id))

            // Assign new clients
            if (toAssign.length > 0) {
                await api.post(`/project-manager/team-members/${id}/assign-clients`, {
                    clientIds: toAssign,
                })
            }

            // Unassign removed clients
            if (toUnassign.length > 0) {
                await api.post(`/project-manager/team-members/${id}/unassign-clients`, {
                    clientIds: toUnassign,
                })
            }

            alert("Client assignments updated successfully!")
            router.push(`/project-manager/team-members/${id}`)
        } catch (error) {
            console.error("Failed to update assignments:", error)
            alert("Failed to update client assignments")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (!teamMember) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Team Member not found</p>
                    <Button asChild className="mt-4">
                        <Link href="/project-manager/team-members">Back to Team Members</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const hasChanges =
        [...selectedClients].some(id => !initiallyAssigned.has(id)) ||
        [...initiallyAssigned].some(id => !selectedClients.has(id))

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/project-manager/team-members/${id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assign Clients</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Managing client assignments for <strong>{teamMember.name}</strong>
                    </p>
                </div>
            </div>

            {/* Client List */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Available Clients
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                        Select clients to assign to this team member
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {allClients.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No clients available</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {allClients.map((client) => (
                                <div
                                    key={client.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedClients.has(client.id)
                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    onClick={() => toggleClient(client.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <Checkbox
                                            checked={selectedClients.has(client.id)}
                                            onCheckedChange={() => toggleClient(client.id)}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {selectedClients.has(client.id) && (
                                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                <Check className="h-3 w-3 mr-1" />
                                                Assigned
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {selectedClients.size} client(s) selected
                            </p>
                            {hasChanges && (
                                <p className="text-sm text-orange-600 dark:text-orange-400">
                                    You have unsaved changes
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={`/project-manager/team-members/${id}`}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Link>
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Save Assignments
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
