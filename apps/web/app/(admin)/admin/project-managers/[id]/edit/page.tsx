"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2, Save, User, Mail, Phone, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"

interface ProjectManager {
    id: string
    name: string
    email: string
    phone: string | null
    pan: string | null
    isActive: boolean
}

export default function EditProjectManagerPage() {
    const router = useRouter()
    const params = useParams()
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        pan: "",
    })

    useEffect(() => {
        if (session?.accessToken && params.id) {
            fetchProjectManager()
        }
    }, [session?.accessToken, params.id])

    const fetchProjectManager = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`http://localhost:4000/api/admin/project-managers/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            })
            const data = await response.json()

            if (data.success) {
                const pm = data.data
                setFormData({
                    name: pm.name || "",
                    email: pm.email || "",
                    phone: pm.phone || "",
                    pan: pm.pan || "",
                })
            } else {
                setError(data.message || "Failed to fetch project manager")
            }
        } catch (err) {
            console.error("Failed to fetch project manager:", err)
            setError("Failed to load project manager details")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccess(null)

        if (!formData.name.trim()) {
            setError("Name is required")
            setIsSaving(false)
            return
        }

        try {
            const response = await fetch(`http://localhost:4000/api/admin/project-managers/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone || null,
                    pan: formData.pan || null,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setSuccess("Project Manager updated successfully!")
                setTimeout(() => {
                    router.push("/admin/project-managers")
                }, 1500)
            } else {
                setError(data.message || "Failed to update project manager")
            }
        } catch (err: any) {
            console.error("Update error:", err)
            setError(err.message || "Failed to update project manager")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/project-managers">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Project Manager</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Update project manager details
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle>Project Manager Details</CardTitle>
                    <CardDescription className="text-blue-100">
                        Edit the information below
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="h-11"
                                />
                            </div>

                            {/* Email (Read-only) */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="h-11 bg-gray-50 dark:bg-gray-800"
                                />
                                <p className="text-xs text-gray-500">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="h-11"
                                />
                            </div>

                            {/* PAN */}
                            <div className="space-y-2">
                                <Label htmlFor="pan" className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                    PAN Number
                                </Label>
                                <Input
                                    id="pan"
                                    name="pan"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    placeholder="ABCDE1234F"
                                    className="h-11 uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/admin/project-managers">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="bg-red-50 dark:bg-red-900/20">
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Deactivate */}
                    <div className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Deactivate Project Manager</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                User won't be able to log in (can be reactivated)
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-yellow-600 text-white hover:bg-yellow-700"
                            onClick={async () => {
                                if (!confirm("Are you sure you want to deactivate this Project Manager? They won't be able to log in.")) return

                                try {
                                    const response = await fetch(`http://localhost:4000/api/admin/project-managers/${params.id}`, {
                                        method: "DELETE",
                                        headers: {
                                            Authorization: `Bearer ${session?.accessToken}`,
                                        },
                                    })
                                    const data = await response.json()

                                    if (data.success) {
                                        alert("Project Manager deactivated successfully!")
                                        router.push("/admin/project-managers")
                                    } else {
                                        alert(data.message || "Failed to deactivate")
                                    }
                                } catch (err) {
                                    console.error("Deactivate error:", err)
                                    alert("Failed to deactivate Project Manager")
                                }
                            }}
                        >
                            Deactivate
                        </Button>
                    </div>

                    {/* Delete Forever */}
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Permanently Delete Project Manager</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                ⚠️ This action CANNOT be undone! User will be removed from database.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                                if (!confirm("⚠️ WARNING: This will PERMANENTLY DELETE this Project Manager from the database. This action CANNOT be undone! Are you absolutely sure?")) return
                                if (!confirm("Final confirmation: Delete this Project Manager permanently?")) return

                                try {
                                    const response = await fetch(`http://localhost:4000/api/admin/project-managers/${params.id}/permanent`, {
                                        method: "DELETE",
                                        headers: {
                                            Authorization: `Bearer ${session?.accessToken}`,
                                        },
                                    })
                                    const data = await response.json()

                                    if (data.success) {
                                        alert("Project Manager permanently deleted!")
                                        router.push("/admin/project-managers")
                                    } else {
                                        alert(data.message || "Failed to delete")
                                    }
                                } catch (err) {
                                    console.error("Delete error:", err)
                                    alert("Failed to delete Project Manager")
                                }
                            }}
                        >
                            Delete Forever
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
