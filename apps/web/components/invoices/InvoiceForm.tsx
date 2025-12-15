"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Calculator, FileText, Download } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

interface InvoiceFormProps {
  userId?: string
  clientId?: string
  serviceId?: string
  onSuccess?: (invoice: any) => void
  initialData?: any
}

export default function InvoiceForm({
  userId: initialUserId,
  clientId: initialClientId,
  serviceId: initialServiceId,
  onSuccess,
  initialData,
}: InvoiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const [formData, setFormData] = useState({
    userId: initialUserId || "",
    clientId: initialClientId || "",
    serviceId: initialServiceId || "",
    invoiceDate: initialData?.invoiceDate
      ? new Date(initialData.invoiceDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: initialData?.items || [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
      },
    ] as InvoiceItem[],
    discount: initialData?.discount || 0,
    notes: initialData?.notes || "",
  })

  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
  })

  // Fetch clients and users on mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch users when client changes
  useEffect(() => {
    if (formData.clientId) {
      fetchUsers(formData.clientId)
    } else {
      setUsers([])
    }
  }, [formData.clientId])

  // Fetch services when user changes
  useEffect(() => {
    if (formData.userId) {
      fetchServices(formData.userId)
    } else {
      setServices([])
    }
  }, [formData.userId])

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discount])

  const fetchClients = async () => {
    setIsLoadingClients(true)
    try {
      const response = await api.get("/project-manager/clients")
      if (response.data.success) {
        setClients(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchUsers = async (clientId: string) => {
    setIsLoadingUsers(true)
    try {
      const response = await api.get(`/ca/users?clientId=${clientId}&role=USER`)
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchServices = async (userId: string) => {
    try {
      const response = await api.get(`/services?userId=${userId}`)
      if (response.data.success) {
        setServices(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const calculateTotals = () => {
    let subtotal = 0

    formData.items.forEach((item: InvoiceItem) => {
      subtotal += Number(item.quantity) * Number(item.unitPrice)
    })

    const subtotalAfterDiscount = subtotal - (formData.discount || 0)
    const taxRate = formData.items[0]?.taxRate || 18
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100
    const totalAmount = subtotalAfterDiscount + taxAmount

    setTotals({
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 18,
        },
      ],
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      })
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId) {
      alert("Please select a user")
      return
    }

    if (formData.items.some((item) => !item.description || item.unitPrice <= 0)) {
      alert("Please fill in all item details")
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        userId: formData.userId,
        clientId: formData.clientId || undefined,
        serviceId: formData.serviceId || undefined,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
        })),
        discount: Number(formData.discount) || 0,
        notes: formData.notes || undefined,
      }

      const response = initialData
        ? await api.put(`/invoices/${initialData.id}`, payload)
        : await api.post("/invoices", payload)

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data)
        } else {
          router.push(`/ca/invoices/${response.data.data.id}`)
        }
      }
    } catch (error: any) {
      console.error("Invoice error:", error)
      alert(error.response?.data?.message || "Failed to save invoice")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewPDF = async () => {
    if (!initialData?.id) {
      alert("Please save the invoice first")
      return
    }

    try {
      const response = await api.get(`/invoices/${initialData.id}/pdf`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `invoice-${initialData.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      alert("Failed to generate PDF")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => {
                  setFormData({ ...formData, clientId: value, userId: "", serviceId: "" })
                }}
                disabled={isLoadingClients || !!initialClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User (Customer) *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => {
                  setFormData({ ...formData, userId: value, serviceId: "" })
                }}
                disabled={isLoadingUsers || !formData.clientId || !!initialUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="serviceId">Service (Optional)</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                disabled={!formData.userId || !!initialServiceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="discount">Discount (₹)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg">
                <div className="col-span-12 md:col-span-5">
                  <Label>Description *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Item description"
                    required
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label>Unit Price (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={item.taxRate}
                    onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value) || 18)}
                  />
                </div>
                <div className="col-span-6 md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Invoice Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="font-medium">₹{(formData.discount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({formData.items[0]?.taxRate || 18}%):</span>
              <span className="font-medium">₹{totals.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg">₹{totals.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Add any additional notes or terms..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
          {isLoading ? "Saving..." : initialData ? "Update Invoice" : "Create Invoice"}
        </Button>
        {initialData && (
          <Button type="button" variant="outline" onClick={handlePreviewPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>
    </form>
  )
}

