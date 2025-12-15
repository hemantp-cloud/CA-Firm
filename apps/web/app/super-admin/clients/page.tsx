"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Client {
    id: string
    email: string
    name: string
    phone: string | null
    companyName: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function ClientsPage() {
    const { data: session } = useSession()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClients = async () => {
            if (!session?.accessToken) return

            try {
                const response = await fetch("http://localhost:4000/api/super-admin/users?role=CLIENT", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setClients(data.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clients:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchClients()
    }, [session?.accessToken])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-600">Manage client accounts</p>
                </div>
                <Link
                    href="/super-admin/clients/new"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
                >
                    + Add Client
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No clients yet</h3>
                        <p className="mt-1 text-gray-500">Get started by registering a new client.</p>
                        <Link
                            href="/super-admin/clients/new"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            + Add Client
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                                                {client.name?.charAt(0) || "C"}
                                            </div>
                                            <span className="ml-3 font-medium text-gray-900">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{client.companyName || "-"}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.email}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.phone || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {client.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/super-admin/clients/${client.id}/edit`} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
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
