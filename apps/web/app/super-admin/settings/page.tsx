"use client"

import { useSession } from "next-auth/react"

export default function SettingsPage() {
    const { data: session } = useSession()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Configure system settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                defaultValue={session?.user?.name || ""}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                defaultValue={session?.user?.email || ""}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                        </div>
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500">Add an extra layer of security</p>
                            </div>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Enable
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900">Change Password</p>
                                <p className="text-sm text-gray-500">Update your password</p>
                            </div>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Update
                            </button>
                        </div>
                    </div>
                </div>

                {/* Firm Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Firm Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                            <input
                                type="text"
                                defaultValue="CA Firm Management"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                defaultValue="info@cafirm.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Version</span>
                            <span className="font-medium text-gray-900">1.0.0</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Environment</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">Development</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Database</span>
                            <span className="flex items-center text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Connected
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
