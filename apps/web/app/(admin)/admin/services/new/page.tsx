"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2, Briefcase, Calendar, User, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

interface Client {
  id: string
  name: string
  companyName: string | null
}

interface ProjectManager {
  id: string
  name: string
}

export default function NewServicePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientId: "",
    projectManagerId: "none",
    type: "",
    title: "",
    description: "",
    financialYear: "",
    period: "",
    dueDate: "",
    feeAmount: "",
    notes: "",
  })

  useEffect(() => {
    if (session?.accessToken) {
      fetchClients()
      fetchProjectManagers()
    }
  }, [session?.accessToken])

  const fetchClients = async () => {
    if (!session?.accessToken) return
    try {
      const response = await fetch("http://localhost:4000/api/admin/clients", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const fetchProjectManagers = async () => {
    if (!session?.accessToken) return
    try {
      const response = await fetch("http://localhost:4000/api/admin/project-managers", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setProjectManagers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch project managers:", error)
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!formData.clientId) {
      setError("Please select a client")
      setIsLoading(false)
      return
    }
    if (!formData.type) {
      setError("Please select a service type")
      setIsLoading(false)
      return
    }
    if (!formData.title.trim()) {
      setError("Service name is required")
      setIsLoading(false)
      return
    }
    if (!formData.dueDate) {
      setError("Due date is required")
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        clientId: formData.clientId,
        projectManagerId: formData.projectManagerId === "none" ? null : formData.projectManagerId,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        dueDate: new Date(formData.dueDate).toISOString(),
        feeAmount: formData.feeAmount ? parseFloat(formData.feeAmount) : null,
        notes: formData.notes || null,
      }

      const response = await fetch("http://localhost:4000/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/admin/services/${data.data.id}`)
      } else {
        setError(data.message || "Failed to create service")
      }
    } catch (err: any) {
      console.error("Create service error:", err)
      setError(err.message || "Failed to create service. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a service request for a client
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Service Details</h2>
          <p className="text-indigo-100 text-sm">Fill in the service information below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Client <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.clientId} onValueChange={(v) => handleChange("clientId", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Manager (Optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Assign to Project Manager
              </Label>
              <Select value={formData.projectManagerId} onValueChange={(v) => handleChange("projectManagerId", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select PM (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projectManagers.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Service Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITR_FILING">ITR Filing</SelectItem>
                  <SelectItem value="GST_REGISTRATION">GST Registration</SelectItem>
                  <SelectItem value="GST_RETURN">GST Return</SelectItem>
                  <SelectItem value="TDS_RETURN">TDS Return</SelectItem>
                  <SelectItem value="TDS_COMPLIANCE">TDS Compliance</SelectItem>
                  <SelectItem value="ROC_FILING">ROC Filing</SelectItem>
                  <SelectItem value="AUDIT">Audit</SelectItem>
                  <SelectItem value="BOOK_KEEPING">Book Keeping</SelectItem>
                  <SelectItem value="PAYROLL">Payroll</SelectItem>
                  <SelectItem value="CONSULTATION">Consultation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., ITR Filing FY 2024-25"
                className="h-11"
              />
            </div>

            {/* Financial Year */}
            <div className="space-y-2">
              <Label htmlFor="financialYear">Financial Year</Label>
              <Input
                id="financialYear"
                value={formData.financialYear}
                onChange={(e) => handleChange("financialYear", e.target.value)}
                placeholder="e.g., 2024-25"
                className="h-11"
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => handleChange("period", e.target.value)}
                placeholder="e.g., Q1, November"
                className="h-11"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="h-11"
              />
            </div>

            {/* Fee Amount */}
            <div className="space-y-2">
              <Label htmlFor="feeAmount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Fee Amount (₹)
              </Label>
              <Input
                id="feeAmount"
                type="number"
                step="0.01"
                value={formData.feeAmount}
                onChange={(e) => handleChange("feeAmount", e.target.value)}
                placeholder="0.00"
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            {/* Internal Notes */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Internal Notes (Admin only)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Internal notes visible only to admin..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/services">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Service Types</h3>
        <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 grid grid-cols-2 gap-1">
          <li>• ITR Filing - Income Tax Returns</li>
          <li>• GST Registration - GST Number</li>
          <li>• GST Return - Monthly/Quarterly</li>
          <li>• TDS Return - TDS Filings</li>
          <li>• ROC Filing - Company Registrar</li>
          <li>• Audit - Statutory Audit</li>
          <li>• Book Keeping - Accounting</li>
          <li>• Payroll - Salary Processing</li>
        </ul>
      </div>
    </div>
  )
}
