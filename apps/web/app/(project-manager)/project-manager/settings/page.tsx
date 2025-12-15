"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Save, User, Lock, Bell, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession()
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("profile")
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Profile Settings
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        pan: "",
    })

    // Password Settings
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // Notification Settings
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        serviceUpdates: true,
        documentUploads: true,
        clientActivity: true,
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/project-manager/profile")
            if (response.data.success) {
                const data = response.data.data
                setProfile({
                    name: data.name || "",
                    email: data.email || session?.user?.email || "",
                    phone: data.phone || "",
                    pan: data.pan || "",
                })
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
            // Use session data as fallback
            if (session?.user) {
                setProfile({
                    name: session.user.name || "",
                    email: session.user.email || "",
                    phone: "",
                    pan: "",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const showSuccess = (message: string) => {
        setSuccessMessage(message)
        setErrorMessage(null)
        setTimeout(() => setSuccessMessage(null), 3000)
    }

    const showError = (message: string) => {
        setErrorMessage(message)
        setSuccessMessage(null)
        setTimeout(() => setErrorMessage(null), 5000)
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const response = await api.put("/project-manager/profile", {
                name: profile.name,
                phone: profile.phone,
                pan: profile.pan,
            })

            if (response.data.success) {
                showSuccess("Profile updated successfully!")
                // Update session with new data
                await updateSession({
                    ...session,
                    user: {
                        ...session?.user,
                        name: profile.name,
                    },
                })
            } else {
                showError(response.data.message || "Failed to update profile")
            }
        } catch (error: any) {
            console.error("Failed to save profile:", error)
            showError(error.response?.data?.message || "Failed to save profile. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError("New passwords do not match")
            return
        }

        if (passwordData.newPassword.length < 6) {
            showError("Password must be at least 6 characters")
            return
        }

        setIsSaving(true)
        try {
            const response = await api.post("/project-manager/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            })

            if (response.data.success) {
                showSuccess("Password changed successfully!")
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                })
            } else {
                showError(response.data.message || "Failed to change password")
            }
        } catch (error: any) {
            console.error("Failed to change password:", error)
            showError(error.response?.data?.message || "Failed to change password. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveNotifications = async () => {
        setIsSaving(true)
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 500))
            showSuccess("Notification preferences saved!")
        } catch (error) {
            showError("Failed to save notification preferences")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`${activeTab === "profile"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`${activeTab === "security"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Lock className="h-4 w-4" />
                        Security
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`${activeTab === "notifications"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Bell className="h-4 w-4" />
                        Notifications
                    </button>
                </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription className="text-emerald-100">
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="h-11 bg-gray-50 dark:bg-gray-800"
                                />
                                <p className="text-xs text-gray-500">Email cannot be changed</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pan" className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    PAN Number
                                </Label>
                                <Input
                                    id="pan"
                                    value={profile.pan}
                                    onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                                    placeholder="ABCDE1234F"
                                    className="h-11 uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
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
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription className="text-orange-100">
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="max-w-md space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">Minimum 6 characters</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button onClick={handleChangePassword} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Changing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription className="text-purple-100">
                            Choose how you want to receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="space-y-0.5">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Receive important updates via email
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notifications.emailNotifications}
                                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="space-y-0.5">
                                    <Label>Service Updates</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Get notified when service status changes
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notifications.serviceUpdates}
                                    onChange={(e) => setNotifications({ ...notifications, serviceUpdates: e.target.checked })}
                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="space-y-0.5">
                                    <Label>Document Uploads</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Notify when clients upload documents
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notifications.documentUploads}
                                    onChange={(e) => setNotifications({ ...notifications, documentUploads: e.target.checked })}
                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Client Activity</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Track client login and activity
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notifications.clientActivity}
                                    onChange={(e) => setNotifications({ ...notifications, clientActivity: e.target.checked })}
                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button onClick={handleSaveNotifications} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Preferences
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
