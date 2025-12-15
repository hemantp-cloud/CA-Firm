"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface AssignedClient {
    id: string
    clientId: string
    clientName: string
    clientEmail: string
    assignedById: string
    assignedAt: string
}

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
    assignedClients?: AssignedClient[]
}

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [tm, setTm] = useState<TeamMember | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchTM()
    }, [id])

    const fetchTM = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/admin/team-members/${id}`)
            if (response.data.success) {
                setTm(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch team member:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!confirm("Are you sure you want to deactivate this Team Member? They won't be able to log in.")) {
            return
        }

        try {
            const response = await api.delete(`/admin/team-members/${id}`)
            if (response.data.success) {
                alert("Team Member deactivated successfully!")
                router.push("/admin/team-members")
            }
        } catch (error) {
            console.error("Failed to deactivate:", error)
            alert("Failed to deactivate Team Member")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Loading team member details...</p>
                </div>
            </div>
        )
    }

    if (!tm) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Team Member not found</p>
                    <Button asChild className="mt-4">
                        <Link href="/admin/team-members">Back to Team Members</Link>
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
                        <Link href="/admin/team-members">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tm.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Team Member Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/admin/team-members/${tm.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/admin/team-members/${tm.id}/assign-clients`}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Clients
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Status Badge */}
            <div>
                <Badge
                    className={
                        tm.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }
                >
                    {tm.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>

            {/* Information */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                <p className="text-gray-900 dark:text-white">{tm.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-white">{tm.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="text-gray-900 dark:text-white">{tm.phone || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</p>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(tm.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                                <p className="text-gray-900 dark:text-white">
                                    {tm.lastLoginAt ? new Date(tm.lastLoginAt).toLocaleString() : "Never"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assigned Clients */}
            {tm.assignedClients && tm.assignedClients.length > 0 && (
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Assigned Clients ({tm.assignedClients.length})
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {tm.assignedClients.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {assignment.clientName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {assignment.clientEmail}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Danger Zone */}
            {tm.isActive && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Danger Zone</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Deactivate Team Member</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    User won't be able to log in (can be reactivated from edit page)
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-yellow-600 text-white hover:bg-yellow-700"
                                onClick={handleDeactivate}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
