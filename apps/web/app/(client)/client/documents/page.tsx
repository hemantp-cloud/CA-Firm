"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Upload, Download, Filter, FileText } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface Document {
  id: string
  fileName: string
  documentType: string | null
  description: string | null
  uploadedAt: string
  isFromCA: boolean
  service: {
    id: string
    title: string
  } | null
}

const uploadSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  serviceId: z.string().optional(),
  description: z.string().optional(),
  file: z.any().refine((file) => file && file.length > 0, "File is required"),
})

type UploadFormData = z.infer<typeof uploadSchema>

export default function ClientDocumentsPage() {
  const searchParams = useSearchParams()
  const preSelectedServiceId = searchParams.get("serviceId")

  const [documents, setDocuments] = useState<Document[]>([])
  const [services, setServices] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      serviceId: preSelectedServiceId || undefined,
    },
  })

  useEffect(() => {
    fetchDocuments()
    fetchServices()
    if (preSelectedServiceId) {
      setIsUploadDialogOpen(true)
    }
  }, [preSelectedServiceId])

  useEffect(() => {
    if (typeFilter !== "all") {
      fetchDocuments()
    }
  }, [typeFilter])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const params = typeFilter !== "all" ? `?type=${typeFilter}` : ""
      const response = await api.get(`/client/documents${params}`)
      if (response.data.success) {
        setDocuments(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get("/client/services")
      if (response.data.success) {
        setServices(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("documentType", data.documentType)
      if (data.serviceId) formData.append("serviceId", data.serviceId)
      if (data.description) formData.append("description", data.description)

      const response = await api.post("/client/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        setIsUploadDialogOpen(false)
        reset()
        setSelectedFile(null)
        fetchDocuments()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.response?.data?.message || "Failed to upload document")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const filteredDocuments = documents.filter((doc) => {
    if (typeFilter === "all") return true
    return doc.documentType === typeFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage your documents
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PAN_CARD">PAN Card</SelectItem>
                <SelectItem value="AADHAR_CARD">Aadhar Card</SelectItem>
                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                <SelectItem value="FORM_16">Form 16</SelectItem>
                <SelectItem value="FORM_26AS">Form 26AS</SelectItem>
                <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Documents ({filteredDocuments.length})
          </h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No documents found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.documentType || "-"}</Badge>
                    </TableCell>
                    <TableCell>{doc.service?.title || "-"}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      {doc.isFromCA ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          From CA
                        </Badge>
                      ) : (
                        <Badge variant="outline">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="documentType">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("documentType") || ""}
                onValueChange={(value) => setValue("documentType", value)}
              >
                <SelectTrigger className={errors.documentType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAN_CARD">PAN Card</SelectItem>
                  <SelectItem value="AADHAR_CARD">Aadhar Card</SelectItem>
                  <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                  <SelectItem value="FORM_16">Form 16</SelectItem>
                  <SelectItem value="FORM_26AS">Form 26AS</SelectItem>
                  <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.documentType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.documentType.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="serviceId">Related Service (Optional)</Label>
              <Select
                value={watch("serviceId") || ""}
                onValueChange={(value) => setValue("serviceId", value)}
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
              <Label htmlFor="file">
                File <span className="text-red-500">*</span>
              </Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedFile(file)
                    setValue("file", [file] as any)
                  }
                }}
                className={errors.file ? "border-red-500" : ""}
              />
              {errors.file && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.file.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="Optional description..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  reset()
                  setSelectedFile(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

