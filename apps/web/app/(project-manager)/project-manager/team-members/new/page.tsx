"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import api from "@/lib/api"

export default function NewTeamMemberPage() {
    const router = useRouter()
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
            const response = await api.post("/project-manager/team-members", {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                password: formData.password,
            })

            if (response.data.success) {
                router.push("/project-manager/team-members")
            } else {
                setError(response.data.message || "Failed to create Team Member")
            }
        } catch (err: any) {
            console.error("Create Team Member error:", err)
            setError(err.response?.data?.message || err.message || "Failed to create Team Member. Please try again.")
        } finally {
            setIsLoading(false)
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Team Member</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create a new team member account
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle>New Team Member</CardTitle>
                    <CardDescription className="text-purple-100">
                        Fill in the details below to create a new team member
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
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
                                    placeholder="John Doe"
                                    className="h-11"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Email Address <span className="text-red-500">*</span>
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

                            {/* Password */}
                            <div className="space-y-2">
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
                                            placeholder="Min 6 characters"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <Button type="button" variant="outline" onClick={generatePassword}>
                                        Generate
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Share these credentials with the team member securely
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
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
                                <Link href="/project-manager/team-members">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
