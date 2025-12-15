"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, User, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import api from "@/lib/api"

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    })

    useEffect(() => {
        fetchTeamMember()
    }, [id])

    const fetchTeamMember = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/project-manager/team-members/${id}`)

            if (response.data.success) {
                const tm = response.data.data
                setFormData({
                    name: tm.name || "",
                    email: tm.email || "",
                    phone: tm.phone || "",
                })
            } else {
                setError(response.data.message || "Failed to fetch team member")
            }
        } catch (err) {
            console.error("Failed to fetch team member:", err)
            setError("Failed to load team member details")
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
            const response = await api.put(`/project-manager/team-members/${id}`, {
                name: formData.name,
                phone: formData.phone || null,
            })

            if (response.data.success) {
                setSuccess("Team Member updated successfully!")
                setTimeout(() => {
                    router.push("/project-manager/team-members")
                }, 1500)
            } else {
                setError(response.data.message || "Failed to update team member")
            }
        } catch (err: any) {
            console.error("Update error:", err)
            setError(err.message || "Failed to update team member")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/project-manager/team-members">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Team Member</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Update team member details
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle>Team Member Details</CardTitle>
                    <CardDescription className="text-purple-100">
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
                            <div className="space-y-2 md:col-span-2">
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
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
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
                                <Link href="/project-manager/team-members">Cancel</Link>
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
                            <p className="font-medium text-gray-900 dark:text-white">Deactivate Team Member</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                User won't be able to log in (can be reactivated)
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-yellow-600 text-white hover:bg-yellow-700"
                            onClick={async () => {
                                if (!confirm("Are you sure you want to deactivate this Team Member? They won't be able to log in.")) return

                                try {
                                    const response = await api.delete(`/project-manager/team-members/${id}`)

                                    if (response.data.success) {
                                        alert("Team Member deactivated successfully!")
                                        router.push("/project-manager/team-members")
                                    } else {
                                        alert(response.data.message || "Failed to deactivate")
                                    }
                                } catch (err) {
                                    console.error("Deactivate error:", err)
                                    alert("Failed to deactivate Team Member")
                                }
                            }}
                        >
                            Deactivate
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
