"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"

export default function EditClientPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string

    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [error, setError] = useState("")
    const [client, setClient] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        pan: "",
        gstin: "",
        isActive: true,
    })

    useEffect(() => {
        if (id) {
            fetchClient()
        }
    }, [id])

    const fetchClient = async () => {
        try {
            setFetchLoading(true)
            const response = await api.get(`/super-admin/users/CLIENT/${id}`)
            if (response.data.success) {
                const data = response.data.data
                setClient(data)
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    companyName: data.companyName || "",
                    pan: data.pan || "",
                    gstin: data.gstin || "",
                    isActive: data.isActive !== undefined ? data.isActive : true,
                })
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch client")
        } finally {
            setFetchLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await api.put(`/super-admin/users/CLIENT/${id}`, formData)

            if (response.data.success) {
                alert("Client updated successfully!")
                router.push("/super-admin/clients")
            } else {
                setError(response.data.message || "Failed to update client")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update client")
        } finally {
            setLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!confirm("Are you sure you want to deactivate this client? They won't be able to log in.")) return

        try {
            setLoading(true)
            const response = await api.delete(`/super-admin/users/CLIENT/${id}`)

            if (response.data.success) {
                alert("Client deactivated successfully!")
                router.push("/super-admin/clients")
            } else {
                setError(response.data.message || "Failed to deactivate client")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to deactivate client")
        } finally {
            setLoading(false)
        }
    }

    const handlePermanentDelete = async () => {
        if (!confirm("⚠️ WARNING: This will PERMANENTLY DELETE this client from the database. This action CANNOT be undone! Are you absolutely sure?")) return
        if (!confirm("Final confirmation: Delete this client permanently?")) return

        try {
            setLoading(true)
            const response = await api.delete(`/super-admin/users/CLIENT/${id}/permanent`)

            if (response.data.success) {
                alert("Client permanently deleted!")
                router.push("/super-admin/clients")
            } else {
                setError(response.data.message || "Failed to delete client")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to delete client")
        } finally {
            setLoading(false)
        }
    }

    if (fetchLoading) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <p className="text-center text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <p className="text-center text-red-500">Client not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link href="/super-admin/clients" className="text-purple-600 hover:text-purple-800 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Clients
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {client.isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                {/* Read-only Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Created At</p>
                            <p className="font-medium text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Last Login</p>
                            <p className="font-medium text-gray-900">{client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleString() : "Never"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email Verified</p>
                            <p className="font-medium text-gray-900">{client.emailVerified ? "Yes" : "No"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Managed By</p>
                            <p className="font-medium text-gray-900">{client.managedBy || "Not Assigned"}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter company name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter email address"
                        />
                        <p className="mt-1 text-sm text-gray-500">Email must be unique across all users</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                pattern="[6-9][0-9]{9}"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="10-digit number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                            <input
                                type="text"
                                value={formData.pan}
                                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                maxLength={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                placeholder="ABCDE1234F"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                            <input
                                type="text"
                                value={formData.gstin}
                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                                maxLength={15}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                placeholder="22AAAAA0000A1Z5"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                            Active (User can log in)
                        </label>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? "Updating..." : "Update Client"}
                            </button>
                            <Link
                                href="/super-admin/clients"
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>

                {/* Danger Zone */}
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Deactivate Client</p>
                                <p className="text-sm text-gray-600">User won't be able to log in (can be reactivated)</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDeactivate}
                                disabled={loading}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Deactivate
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Permanently Delete Client</p>
                                <p className="text-sm text-red-600">⚠️ This action CANNOT be undone! User will be removed from database.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handlePermanentDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
