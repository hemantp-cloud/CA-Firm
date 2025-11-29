"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  contactPerson: string | null
  usersCount: number
  isActive: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/admin/ca")
      if (response.data.success) {
        setClients(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch CA:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivate = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this CA?")) {
      return
    }

    try {
      await api.post(`/admin/ca/${id}/reactivate`)
      fetchClients()
      alert("CA reactivated successfully")
    } catch (error) {
      console.error("Failed to reactivate CA:", error)
      alert("Failed to reactivate CA")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will also deactivate all clients under this CA.")) {
      return
    }

    try {
      await api.delete(`/admin/ca/${id}`)
      fetchClients()
    } catch (error) {
      console.error("Failed to delete CA:", error)
      alert("Failed to deactivate CA")
    }
  }

  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.contactPerson?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CA</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your ca partners and sub-agents
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/ca/new">
            <Plus className="h-4 w-4 mr-2" />
            Add CA
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search ca by name, email, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All CA ({filteredClients.length})
          </h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Clients Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading CAs...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-gray-500 dark:text-gray-400">No CAs found</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/ca/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First CA
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className={!client.isActive ? "opacity-60 bg-gray-50 dark:bg-gray-900/50" : ""}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contactPerson || "-"}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.usersCount}</Badge>
                    </TableCell>
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
                            <Link href={`/admin/ca/${client.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/ca/${client.id}/edit`} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {client.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleDelete(client.id)}
                              className="text-red-600 dark:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleReactivate(client.id)}
                              className="text-green-600 dark:text-green-400 cursor-pointer"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
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

