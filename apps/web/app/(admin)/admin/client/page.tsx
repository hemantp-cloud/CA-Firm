"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  companyName: string | null
  pan: string | null
  gstin: string | null
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    fetchClients()
  }, [statusFilter])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("isActive", statusFilter === "active" ? "true" : "false")

      const response = await api.get(`/admin/clients?${params.toString()}`)
      if (response.data.success) {
        setClients(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) {
      return
    }

    try {
      await api.delete(`/admin/clients/${id}`)
      alert("Client deactivated successfully!")
      fetchClients()
    } catch (error) {
      console.error("Failed to deactivate client:", error)
      alert("Failed to deactivate client")
    }
  }

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`⚠️ WARNING: This will PERMANENTLY DELETE ${name} from the database. This action CANNOT be undone! Are you absolutely sure?`)) {
      return
    }
    if (!confirm("Final confirmation: Delete this client permanently?")) {
      return
    }

    try {
      await api.delete(`/admin/clients/${id}/permanent`)
      alert("Client permanently deleted!")
      fetchClients()
    } catch (error) {
      console.error("Failed to permanently delete client:", error)
      alert("Failed to permanently delete client")
    }
  }

  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.companyName?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all client accounts
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/client/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search clients by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Clients ({filteredClients.length})
          </h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>PAN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-gray-500 dark:text-gray-400">No clients found</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/client/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Client
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.companyName || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{client.pan || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          client.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }
                      >
                        {client.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/client/${client.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/client/${client.id}/edit`} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {client.isActive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(client.id, client.name)}
                                className="text-orange-600 dark:text-orange-400 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handlePermanentDelete(client.id, client.name)}
                            className="text-red-600 dark:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Forever
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
