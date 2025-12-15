"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface TeamMember {
    id: string
    email: string
    name: string
    phone: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function TeamMembersPage() {
    const { data: session } = useSession()
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMembers = async () => {
            if (!session?.accessToken) return

            try {
                const response = await fetch("http://localhost:4000/api/super-admin/users?role=TEAM_MEMBER", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setMembers(data.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch team members:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMembers()
    }, [session?.accessToken])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Members (Trainees)</h1>
                    <p className="text-gray-600">Manage trainee / staff users</p>
                </div>
                <Link
                    href="/super-admin/team-members/new"
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30"
                >
                    + Add Team Member
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No team members yet</h3>
                        <p className="mt-1 text-gray-500">Get started by adding a trainee or staff member.</p>
                        <Link
                            href="/super-admin/team-members/new"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                            + Add Team Member
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
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-semibold">
                                                {member.name?.charAt(0) || "T"}
                                            </div>
                                            <span className="ml-3 font-medium text-gray-900">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                                    <td className="px-6 py-4 text-gray-600">{member.phone || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {member.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/super-admin/team-members/${member.id}/edit`} className="text-amber-600 hover:text-amber-800 text-sm font-medium">
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
