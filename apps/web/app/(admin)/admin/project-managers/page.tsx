"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, Edit, Trash2, MoreVertical, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

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
    fetchPMs()
  }, [])

  const fetchPMs = async () => {
    try {
      setLoading(true)
      const response = await api.get("/admin/project-managers")
      if (response.data.success) {
        setPms(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch project managers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return

    try {
      const response = await api.delete(`/admin/project-managers/${id}`)
      if (response.data.success) {
        alert("Project Manager deactivated successfully!")
        fetchPMs() // Refresh list
      }
    } catch (error) {
      console.error("Failed to deactivate:", error)
      alert("Failed to deactivate Project Manager")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Managers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage Project Manager users</p>
        </div>
        <Link
          href="/admin/project-managers/new"
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30"
        >
          <Plus className="h-4 w-4 inline-block mr-2" />
          Add Project Manager
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : pms.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No project managers yet</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Get started by creating a new Project Manager.</p>
            <Link
              href="/admin/project-managers/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              + Add Project Manager
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pms.map((pm) => (
                <tr key={pm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-semibold">
                        {pm.name?.charAt(0) || "P"}
                      </div>
                      <span className="ml-3 font-medium text-gray-900 dark:text-white">{pm.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pm.email}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pm.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pm.isActive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                      {pm.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/project-managers/${pm.id}`} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/project-managers/${pm.id}/edit`} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {pm.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(pm.id, pm.name)}
                              className="text-orange-600 dark:text-orange-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
