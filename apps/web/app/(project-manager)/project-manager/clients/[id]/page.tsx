"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, UserCircle, Mail, Phone, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import api from "@/lib/api"

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  pan: string | null
  aadhar: string | null
  address: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  services: Array<{
    id: string
    title: string
    type: string
    status: string
    dueDate: string | null
  }>
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/project-manager/clients/${clientId}`)
      if (response.data.success) {
        setClient(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch client:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to deactivate this client?")) {
      return
    }

    try {
      await api.delete(`/project-manager/clients/${clientId}`)
      router.push("/project-manager/clients")
    } catch (error) {
      console.error("Failed to delete client:", error)
      alert("Failed to deactivate client")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading client details...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 mb-4">Client not found</p>
        <Button asChild>
          <Link href="/project-manager/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/project-manager/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Client details and services</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/project-manager/clients/${clientId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Deactivate
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Client Information</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <UserCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{client.email}</p>
              </div>
            </div>

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{client.phone}</p>
                </div>
              </div>
            )}

            {client.pan && (
              <div className="flex items-start gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">PAN</p>
                <p className="font-medium text-gray-900 dark:text-white">{client.pan}</p>
              </div>
            )}

            {client.aadhar && (
              <div className="flex items-start gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Aadhar</p>
                <p className="font-medium text-gray-900 dark:text-white">{client.aadhar}</p>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{client.address}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge
                className={
                  client.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }
              >
                {client.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-start gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(client.lastLoginAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Services ({client.services.length})
          </h2>
        </CardHeader>
        <CardContent>
          {client.services.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No services found for this client</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.title}</TableCell>
                    <TableCell>{formatStatus(service.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(service.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {service.dueDate ? formatDate(service.dueDate) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/project-manager/services/${service.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

