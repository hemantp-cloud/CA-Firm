"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface ProjectManager {
    id: string
    email: string
    name: string
    phone: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function ProjectManagersPage() {
    const { data: session } = useSession()
    const [pms, setPms] = useState<ProjectManager[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPMs = async () => {
            if (!session?.accessToken) return

            try {
                const response = await fetch("http://localhost:4000/api/super-admin/users?role=PROJECT_MANAGER", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setPms(data.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch project managers:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPMs()
    }, [session?.accessToken])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Managers (CAs)</h1>
                    <p className="text-gray-600">Manage CA / Project Manager users</p>
                </div>
                <Link
                    href="/super-admin/project-managers/new"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30"
                >
                    + Add Project Manager
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading...</p>
                    </div>
                ) : pms.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No project managers yet</h3>
                        <p className="mt-1 text-gray-500">Get started by creating a new CA / Project Manager.</p>
                        <Link
                            href="/super-admin/project-managers/new"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            + Add Project Manager
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
                            {pms.map((pm) => (
                                <tr key={pm.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">
                                                {pm.name?.charAt(0) || "P"}
                                            </div>
                                            <span className="ml-3 font-medium text-gray-900">{pm.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{pm.email}</td>
                                    <td className="px-6 py-4 text-gray-600">{pm.phone || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pm.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {pm.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/super-admin/project-managers/${pm.id}/edit`} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
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
