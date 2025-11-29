"use client"

import { useState } from "react"
import { Save, Settings as SettingsIcon, Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [settings, setSettings] = useState({
        // General Settings
        companyName: "CA Firm Management",
        companyEmail: "admin@cafirm.com",
        companyPhone: "+91 1234567890",
        companyAddress: "",

        // Notification Settings
        emailNotifications: true,
        smsNotifications: false,
        invoiceReminders: true,
        serviceUpdates: true,

        // Security Settings
        twoFactorAuth: false,
        sessionTimeout: "30",
        passwordExpiry: "90",
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // API call to save settings would go here
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated delay
            alert("Settings saved successfully!")
        } catch (error) {
            console.error("Failed to save settings:", error)
            alert("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your application settings and preferences
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Simple Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`${activeTab === "general"
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <SettingsIcon className="h-4 w-4" />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`${activeTab === "notifications"
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Bell className="h-4 w-4" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`${activeTab === "security"
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Shield className="h-4 w-4" />
                        Security
                    </button>
                </nav>
            </div>

            {/* General Settings */}
            {activeTab === "general" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>
                            Update your company details and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={settings.companyName}
                                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="companyEmail">Company Email</Label>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    value={settings.companyEmail}
                                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="companyPhone">Company Phone</Label>
                                <Input
                                    id="companyPhone"
                                    value={settings.companyPhone}
                                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="companyAddress">Company Address</Label>
                            <Input
                                id="companyAddress"
                                value={settings.companyAddress}
                                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                                placeholder="Enter company address"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription>
                            Choose how you want to receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Receive notifications via email
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) =>
                                    setSettings({ ...settings, emailNotifications: e.target.checked })
                                }
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="space-y-0.5">
                                <Label>SMS Notifications</Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Receive notifications via SMS
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.smsNotifications}
                                onChange={(e) =>
                                    setSettings({ ...settings, smsNotifications: e.target.checked })
                                }
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="space-y-0.5">
                                <Label>Invoice Reminders</Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Get reminders for pending invoices
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.invoiceReminders}
                                onChange={(e) =>
                                    setSettings({ ...settings, invoiceReminders: e.target.checked })
                                }
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Service Updates</Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Notifications about service status changes
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.serviceUpdates}
                                onChange={(e) =>
                                    setSettings({ ...settings, serviceUpdates: e.target.checked })
                                }
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                            Manage security and authentication settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="space-y-0.5">
                                <Label>Two-Factor Authentication</Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Require 2FA for all admin users
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.twoFactorAuth}
                                onChange={(e) =>
                                    setSettings({ ...settings, twoFactorAuth: e.target.checked })
                                }
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                                <Input
                                    id="sessionTimeout"
                                    type="number"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Auto-logout after inactivity
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                                <Input
                                    id="passwordExpiry"
                                    type="number"
                                    value={settings.passwordExpiry}
                                    onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Force password change after
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
