"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Admin {
    id: string
    email: string
    name: string
    phone: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function AdminsPage() {
    const { data: session } = useSession()
    const [admins, setAdmins] = useState<Admin[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAdmins = async () => {
            if (!session?.accessToken) return

            try {
                const response = await fetch("http://localhost:4000/api/super-admin/users?role=ADMIN", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setAdmins(data.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch admins:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAdmins()
    }, [session?.accessToken])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
                    <p className="text-gray-600">Manage admin users</p>
                </div>
                <Link
                    href="/super-admin/admins/new"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
                >
                    + Add Admin
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading...</p>
                    </div>
                ) : admins.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No admins yet</h3>
                        <p className="mt-1 text-gray-500">Get started by creating a new admin user.</p>
                        <Link
                            href="/super-admin/admins/new"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            + Add Admin
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                                {admin.name?.charAt(0) || "A"}
                                            </div>
                                            <span className="ml-3 font-medium text-gray-900">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                                    <td className="px-6 py-4 text-gray-600">{admin.phone || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {admin.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/super-admin/admins/${admin.id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
