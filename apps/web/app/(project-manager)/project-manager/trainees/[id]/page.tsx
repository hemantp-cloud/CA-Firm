"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Users, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    }
    assignedBy: {
        id: string
        name: string
        email: string
    }
    assignedAt: string
    notes: string | null
}

interface Trainee {
    id: string
    name: string
    email: string
    phone: string | null
    pan: string | null
    aadhar: string | null
    address: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
    assignedClients: AssignedClient[]
}

export default function CATraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [trainee, setTrainee] = useState<Trainee | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchTrainee()
    }, [id])

    const fetchTrainee = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/trainees/${id}`)
            if (response.data.success) {
                setTrainee(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch trainee:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Loading trainee details...</p>
                </div>
            </div>
        )
    }

    if (!trainee) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Trainee not found</p>
                    <Button asChild className="mt-4">
                        <Link href="/ca/trainees">Back to Trainees</Link>
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
                        <Link href="/ca/trainees">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{trainee.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Trainee Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/ca/trainees/${trainee.id}/assign-clients`}>
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
                        trainee.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }
                >
                    {trainee.isActive ? "Active" : "Inactive"}
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
                                <p className="text-gray-900 dark:text-white">{trainee.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="text-gray-900 dark:text-white">{trainee.phone || "-"}</p>
                            </div>
                        </div>

                        {trainee.address && (
                            <div className="flex items-start gap-3 md:col-span-2">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-gray-900 dark:text-white">{trainee.address}</p>
                                </div>
                            </div>
                        )}

                        {(trainee.pan || trainee.aadhar) && (
                            <>
                                {trainee.pan && (
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN</p>
                                            <p className="text-gray-900 dark:text-white">{trainee.pan}</p>
                                        </div>
                                    </div>
                                )}

                                {trainee.aadhar && (
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar</p>
                                            <p className="text-gray-900 dark:text-white">{trainee.aadhar}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</p>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(trainee.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                                <p className="text-gray-900 dark:text-white">
                                    {trainee.lastLoginAt ? new Date(trainee.lastLoginAt).toLocaleDateString() : "Never"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assigned Clients */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Assigned Clients ({trainee.assignedClients?.length || 0})
                        </h2>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/ca/trainees/${trainee.id}/assign-clients`}>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Assignments
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {trainee.assignedClients && trainee.assignedClients.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Assigned By</TableHead>
                                    <TableHead>Assigned On</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainee.assignedClients.map((assignment) => (
                                    <TableRow key={assignment.assignmentId}>
                                        <TableCell className="font-medium">{assignment.client.name}</TableCell>
                                        <TableCell>{assignment.client.email}</TableCell>
                                        <TableCell>{assignment.client.phone || "-"}</TableCell>
                                        <TableCell>{assignment.assignedBy.name}</TableCell>
                                        <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No clients assigned yet</p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/ca/trainees/${trainee.id}/assign-clients`}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Clients
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
