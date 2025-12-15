"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function NewTeamMemberPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
        let password = ""
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData(prev => ({ ...prev, password }))
        setShowPassword(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        // Validation
        if (!formData.name.trim()) {
            setError("Name is required")
            setIsLoading(false)
            return
        }
        if (!formData.email.trim()) {
            setError("Email is required")
            setIsLoading(false)
            return
        }
        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("http://localhost:4000/api/admin/team-members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                router.push("/admin/team-members")
            } else {
                setError(data.message || "Failed to create Team Member")
            }
        } catch (err: any) {
            console.error("Create Team Member error:", err)
            setError(err.message || "Failed to create Team Member. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/team-members">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Team Member</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create a new Team Member account
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Team Member Information</h2>
                    <p className="text-amber-100 text-sm">Fill in the details below to create a new Team Member</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

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
                                placeholder="John Doe"
                                className="h-11"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className="h-11"
                            />
                            <p className="text-xs text-gray-500">This will be their login email</p>
                        </div>

                        {/* Phone */}
                        <div className="md:col-span-2 space-y-2">
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

                        {/* Password */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={generatePassword} className="h-11">
                                    Generate
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Share this password securely with the Team Member</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                "Create Team Member"
                            )}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/team-members">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Info Card */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">What can Team Members do?</h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• View assigned clients and their details</li>
                    <li>• Access documents for their assigned clients</li>
                    <li>• Work on services assigned to them</li>
                    <li>• Report to their assigned Project Manager</li>
                </ul>
            </div>
        </div>
    )
}
