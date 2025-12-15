"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, CreditCard, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface ProjectManager {
    id: string
    name: string
    email: string
    phone: string | null
    pan: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function ProjectManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [pm, setPm] = useState<ProjectManager | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchPM()
    }, [id])

    const fetchPM = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/admin/project-managers/${id}`)
            if (response.data.success) {
                setPm(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch project manager:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!confirm("Are you sure you want to deactivate this Project Manager? They won't be able to log in.")) {
            return
        }

        try {
            const response = await api.delete(`/admin/project-managers/${id}`)
            if (response.data.success) {
                alert("Project Manager deactivated successfully!")
                router.push("/admin/project-managers")
            }
        } catch (error) {
            console.error("Failed to deactivate:", error)
            alert("Failed to deactivate Project Manager")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Loading project manager details...</p>
                </div>
            </div>
        )
    }

    if (!pm) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500">Project Manager not found</p>
                    <Button asChild className="mt-4">
                        <Link href="/admin/project-managers">Back to Project Managers</Link>
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
                        <Link href="/admin/project-managers">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pm.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Project Manager Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/admin/project-managers/${pm.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Status Badge */}
            <div>
                <Badge
                    className={
                        pm.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }
                >
                    {pm.isActive ? "Active" : "Inactive"}
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
                                <p className="text-gray-900 dark:text-white">{pm.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-white">{pm.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="text-gray-900 dark:text-white">{pm.phone || "-"}</p>
                            </div>
                        </div>

                        {pm.pan && (
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN</p>
                                    <p className="text-gray-900 dark:text-white">{pm.pan}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</p>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(pm.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                                <p className="text-gray-900 dark:text-white">
                                    {pm.lastLoginAt ? new Date(pm.lastLoginAt).toLocaleString() : "Never"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            {pm.isActive && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Danger Zone</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Deactivate Project Manager</p>
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
