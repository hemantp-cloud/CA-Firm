"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { User, Mail, Phone, Calendar, Shield, Lock, Loader2, Save, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

interface ProfileData {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function TeamMemberSettingsPage() {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/auth/me")
            if (response.data.success || response.data.data) {
                setProfile(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setErrorMessage("New passwords do not match")
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters")
            return
        }

        setIsChangingPassword(true)

        try {
            const response = await api.post("/auth/change-password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })

            if (response.data.success) {
                setSuccessMessage("Password changed successfully!")
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                })
            } else {
                setErrorMessage(response.data.message || "Failed to change password")
            }
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Failed to change password")
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View your profile and manage account settings
                </p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription className="text-teal-100">
                        Your account details
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {profile?.name || session?.user?.name || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-gray-900 dark:text-white">
                                    {profile?.email || session?.user?.email || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                                <p className="text-gray-900 dark:text-white">
                                    {profile?.phone || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                                    Team Member
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
                                <Badge className={profile?.isActive
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800"
                                }>
                                    {profile?.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                                <p className="text-gray-900 dark:text-white">
                                    {profile?.lastLoginAt
                                        ? new Date(profile.lastLoginAt).toLocaleString()
                                        : "Never"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your account password
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {successMessage && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Enter current password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Enter new password (min 6 characters)"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isChangingPassword}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {isChangingPassword ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Changing...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Change Password
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
