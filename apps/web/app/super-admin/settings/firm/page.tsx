"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import api from "@/lib/api"

export default function FirmSettingsPage() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
        pan: "",
        website: "",
        logo: "",
    })

    useEffect(() => {
        fetchFirmSettings()
    }, [])

    const fetchFirmSettings = async () => {
        try {
            setFetchLoading(true)
            const response = await api.get("/super-admin/firm/settings")
            if (response.data.success) {
                const data = response.data.data
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    gstin: data.gstin || "",
                    pan: data.pan || "",
                    website: data.website || "",
                    logo: data.logo || "",
                })
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch firm settings")
        } finally {
            setFetchLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const response = await api.put("/super-admin/firm/settings", formData)

            if (response.data.success) {
                setSuccess("Firm settings updated successfully!")
                setTimeout(() => setSuccess(""), 3000)
            } else {
                setError(response.data.message || "Failed to update firm settings")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update firm settings")
        } finally {
            setLoading(false)
        }
    }

    if (fetchLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <p className="text-center text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Firm Settings</h1>
                    <p className="text-gray-600">Manage your organization details and configuration</p>
                </div>
                <Link
                    href="/super-admin/dashboard"
                    className="text-purple-600 hover:text-purple-800 flex items-center"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>

            {/* Success Message */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
            )}

            {/* Settings Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Organization Information</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Firm Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Firm Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter firm name"
                        />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="firm@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                pattern="[6-9][0-9]{9}"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="10-digit number"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter complete address"
                        />
                    </div>

                    {/* GSTIN & PAN */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GSTIN
                            </label>
                            <input
                                type="text"
                                value={formData.gstin}
                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                                maxLength={15}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                placeholder="22AAAAA0000A1Z5"
                            />
                            <p className="mt-1 text-xs text-gray-500">15 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PAN
                            </label>
                            <input
                                type="text"
                                value={formData.pan}
                                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                maxLength={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                placeholder="ABCDE1234F"
                            />
                            <p className="mt-1 text-xs text-gray-500">Format: ABCDE1234F</p>
                        </div>
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website
                        </label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="https://example.com"
                        />
                    </div>

                    {/* Logo URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Logo URL
                        </label>
                        <input
                            type="url"
                            value={formData.logo}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="https://example.com/logo.png"
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter URL of your firm logo</p>
                    </div>

                    {/* Submit Button */}
                    <div className="border-t pt-6">
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                            <Link
                                href="/super-admin/dashboard"
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
