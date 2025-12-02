"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Upload, FileText, Trash2, AlertCircle, CheckCircle, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"
import { toast } from "sonner"

interface Document {
  id: string
  fileName: string
  documentType: string | null
  description: string | null
  uploadedAt: string
  uploadStatus: string
  submittedAt: string | null
  fileSize: string
  service: {
    id: string
    title: string
  } | null
}

const DOCUMENT_TYPES = [
  "PAN_CARD",
  "AADHAR_CARD",
  "BANK_STATEMENT",
  "FORM_16",
  "FORM_26AS",
  "GST_CERTIFICATE",
  "OTHER",
]

export default function ClientDocumentsPage() {
  const searchParams = useSearchParams()
  const preSelectedServiceId = searchParams.get("serviceId")
  const { status } = useSession()

  const [draftDocuments, setDraftDocuments] = useState<Document[]>([])
  const [submittedDocuments, setSubmittedDocuments] = useState<Document[]>([])
  const [services, setServices] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments()
      fetchServices()
      if (preSelectedServiceId) {
        setServiceId(preSelectedServiceId)
        setIsUploadDialogOpen(true)
      }
    } else if (status === "loading") {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [status, preSelectedServiceId])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/client/documents")
      if (response.data.success) {
        const docs = response.data.data || []
        setDraftDocuments(docs.filter((doc: Document) => doc.uploadStatus === "DRAFT"))
        setSubmittedDocuments(docs.filter((doc: Document) => doc.uploadStatus === "SUBMITTED"))
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get("/client/services")
      if (response.data.success) {
        setServices(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadDraft = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("documentType", documentType)
      if (serviceId) formData.append("serviceId", serviceId)
      if (description) formData.append("description", description)

      const response = await api.post("/client/documents/draft", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        toast.success("Document uploaded as draft")
        fetchDocuments()
        resetUploadForm()
        setIsUploadDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.response?.data?.message || "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitDocuments = async () => {
    if (draftDocuments.length === 0) {
      toast.error("No draft documents to submit")
      return
    }

    try {
      setIsSubmitting(true)
      const documentIds = draftDocuments.map((doc) => doc.id)

      const response = await api.post("/client/documents/submit", { documentIds })

      if (response.data.success) {
        toast.success(`${documentIds.length} document(s) submitted successfully`)
        fetchDocuments()
        setIsSubmitDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.response?.data?.message || "Failed to submit documents")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDraft = async (documentId: string) => {
    try {
      const response = await api.delete(`/client/documents/draft/${documentId}`)

      if (response.data.success) {
        toast.success("Draft document deleted")
        fetchDocuments()
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.response?.data?.message || "Failed to delete document")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDocumentType("")
    setServiceId("")
    setDescription("")
  }

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await api.get(`/documents/view/${documentId}`, {
        responseType: 'blob',
      })

      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/pdf'

      // Create blob URL with proper content type and open in new tab
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error: any) {
      console.error('View error:', error)
      toast.error(error.response?.data?.message || 'Failed to view document')
    }
  }

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await api.get(`/documents/download/${documentId}`, {
        responseType: 'blob',
      })

      // Create blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Document downloaded successfully')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.response?.data?.message || 'Failed to download document')
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your documents
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Tabs for Draft and Submitted */}
      <Tabs defaultValue="drafts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts ({draftDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Draft Documents Tab */}
        <TabsContent value="drafts" className="space-y-4">
          {draftDocuments.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <CardTitle className="text-lg">Draft Documents</CardTitle>
                      <CardDescription>
                        These documents are not yet visible to your CA. Click "Submit All" to finalize.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsSubmitDialogOpen(true)}
                    variant="default"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit All ({draftDocuments.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {draftDocuments.map((doc) => (
                    <Card key={doc.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{doc.fileName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{doc.documentType}</Badge>
                                <span>•</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {draftDocuments.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No draft documents</p>
                <p className="text-sm text-muted-foreground">
                  Upload a document to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submitted Documents Tab */}
        <TabsContent value="submitted" className="space-y-4">
          {submittedDocuments.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {submittedDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-500" />
                            <div>
                              <p className="font-medium">{doc.fileName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">{doc.documentType}</Badge>
                                <span>•</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span>Submitted {formatDate(doc.submittedAt || doc.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(doc.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Submitted
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No submitted documents</p>
                <p className="text-sm text-muted-foreground">
                  Submit your draft documents to see them here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document as draft. You can submit it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Related Service (Optional)</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
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
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this document"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                resetUploadForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadDraft} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Documents?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                You are about to submit {draftDocuments.length} document(s). Once submitted:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Documents will be visible to your CA and Admin</li>
                  <li>You cannot delete submitted documents</li>
                  <li>Documents will be organized in your folder</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitDocuments} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteDraft(deleteConfirmId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
