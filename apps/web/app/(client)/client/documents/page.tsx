"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import {
  FileText,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Upload,
  X,
  Shield,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"
import { toast } from "sonner"
import DocumentTypeSearch from "@/components/documents/DocumentTypeSearch"

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: string
  uploadedAt: string
  documentType: string | null
  description: string | null
  service?: {
    id: string
    title: string
  } | null
}

interface DocumentType {
  type: string
  count: number
  documents: Document[]
}

interface UserFolder {
  userId: string
  userName: string
  userEmail: string
  documentTypes: DocumentType[]
}

// NEW: Category section for two-level hierarchy
interface CategorySection {
  category: string
  documentTypes: DocumentType[]
  totalFiles: number
}

interface RoleSection {
  title: string
  users: UserFolder[]
  categories?: CategorySection[]  // NEW: Category-based grouping
  totalFiles: number
}

interface HierarchicalData {
  myDocuments: RoleSection
}

// Document library types
interface DocumentMasterItem {
  id: string
  code: string
  name: string
  description: string | null
}

interface CategoryData {
  category: string
  documents: DocumentMasterItem[]
}

interface DocumentLibraryData {
  categories: CategoryData[]
  hints: Record<string, string>
}

export default function ClientDocumentsPage() {
  const [data, setData] = useState<HierarchicalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // Document library for two-step selection
  const [documentLibrary, setDocumentLibrary] = useState<DocumentLibraryData | null>(null)
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // NEW: Combined document type selection (from search-first component)
  const [selectedDocType, setSelectedDocType] = useState<{
    documentType: string
    category: string
    name: string
    customName?: string  // For OTHER documents
  } | null>(null)
  // Keep these for backward compatibility (will be removed later)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [documentType, setDocumentType] = useState<string>("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/client/documents/hierarchy")
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocumentLibrary = async () => {
    try {
      setIsLoadingLibrary(true)
      const response = await api.get("/document-slots/document-library")
      if (response.data.success) {
        setDocumentLibrary(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch document library:", error)
      // Non-critical, continue with fallback
    } finally {
      setIsLoadingLibrary(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchDocumentLibrary()
  }, [])

  const toggleType = (key: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedTypes(newExpanded)
  }

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/client/documents/${doc.id}/download`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Document downloaded")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download document")
    }
  }

  const handleView = async (doc: Document) => {
    try {
      const response = await api.get(`/client/documents/${doc.id}/download`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: doc.fileType })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error("View error:", error)
      toast.error("Failed to view document")
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      const response = await api.delete(`/client/documents/${docId}`)
      if (response.data.success) {
        toast.success("Document deleted successfully")
        fetchDocuments()
      }
    } catch (error: any) {
      console.error("Failed to delete document:", error)
      toast.error(error.response?.data?.message || "Failed to delete document")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }

    // Use new search-first selection if available, otherwise fallback to old state
    const docTypeToUse = selectedDocType?.documentType || documentType
    const categoryToUse = selectedDocType?.category || selectedCategory

    if (!docTypeToUse) {
      toast.error("Please select a document type")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', docTypeToUse)
      formData.append('category', categoryToUse)
      // NEW: Send customName for OTHER documents to enable auto-matching
      if (selectedDocType?.customName) {
        formData.append('customName', selectedDocType.customName)
      }
      if (description) {
        formData.append('description', description)
      }

      const response = await api.post('/client/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast.success("Document uploaded successfully!")
        setUploadModalOpen(false)
        setSelectedFile(null)
        setSelectedDocType(null)       // Reset new state
        setSelectedCategory("")        // Reset old state (backward compat)
        setDocumentType("")            // Reset old state (backward compat)
        setDescription("")
        fetchDocuments()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.response?.data?.message || "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes)
    if (size < 1024) return size + " B"
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB"
    return (size / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDocumentType = (type: string) => {
    return type.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ")
  }

  const totalFiles = data?.myDocuments?.totalFiles || 0
  const documentTypes = data?.myDocuments?.users?.[0]?.documentTypes || []
  const categories = data?.myDocuments?.categories || []  // NEW: Category-based grouping

  return (
    <div className="space-y-6">
      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document to your account. Your CA firm will be able to view this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File Selector */}
            <div className="space-y-2">
              <Label>Select File</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, XLS, JPG, PNG (Max 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </div>

            {/* NEW: Search-First Document Type Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                What type of document is this? <span className="text-red-500">*</span>
              </Label>
              <DocumentTypeSearch
                value={selectedDocType?.documentType}
                onSelect={setSelectedDocType}
                documentLibrary={documentLibrary}
                placeholder="Search for document type... e.g., 'PAN Card'"
              />
              <p className="text-xs text-muted-foreground">
                Start typing to search. Category will be set automatically.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Add a description for this document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadModalOpen(false)
              setSelectedDocType(null)
              setSelectedCategory("")
              setDocumentType("")
              setSelectedFile(null)
              setDescription("")
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedDocType || isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground">
            View and manage your uploaded documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setUploadModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
          <Button onClick={fetchDocuments} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">Secure Document Storage</span>
        </div>
        <p className="text-sm mt-1 opacity-90">
          Your documents are securely stored and accessible to you and your CA firm.
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Documents in your account
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Types</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Different categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Upload</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setUploadModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full mt-1"
            >
              Upload New Document
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Your Documents by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading documents...
            </div>
          ) : !data ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Failed to load documents
              </p>
            </div>
          ) : totalFiles === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't uploaded any documents yet. Get started by uploading your first document.
              </p>
              <Button onClick={() => setUploadModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* NEW: Two-level hierarchy: Category → Document Type */}
              {categories.length > 0 ? (
                // Show category-based grouping
                categories.map((category) => {
                  const categoryKey = `cat-${category.category}`
                  const isCategoryExpanded = expandedTypes.has(categoryKey)

                  return (
                    <div key={categoryKey} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 cursor-pointer hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-colors"
                        onClick={() => toggleType(categoryKey)}
                      >
                        {isCategoryExpanded ? (
                          <ChevronDown className="h-5 w-5 text-purple-600" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-purple-600" />
                        )}
                        {isCategoryExpanded ? (
                          <FolderOpen className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Folder className="h-5 w-5 text-purple-600" />
                        )}
                        <span className="font-semibold text-purple-800 dark:text-purple-200">{category.category}</span>
                        <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                          {category.totalFiles} {category.totalFiles === 1 ? 'file' : 'files'}
                        </Badge>
                      </div>

                      {/* Document Types within Category */}
                      {isCategoryExpanded && (
                        <div className="border-t bg-white dark:bg-gray-900 p-2 space-y-2">
                          {category.documentTypes.map((docType) => {
                            const typeKey = `${categoryKey}-${docType.type}`
                            const isTypeExpanded = expandedTypes.has(typeKey)

                            return (
                              <div key={typeKey} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                                {/* Document Type Header */}
                                <div
                                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  onClick={() => toggleType(typeKey)}
                                >
                                  {isTypeExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                  {isTypeExpanded ? (
                                    <FolderOpen className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <Folder className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="font-medium text-sm">{formatDocumentType(docType.type)}</span>
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    {docType.count} {docType.count === 1 ? 'file' : 'files'}
                                  </Badge>
                                </div>

                                {/* Documents */}
                                {isTypeExpanded && (
                                  <div className="bg-white dark:bg-gray-900 border-t p-2 space-y-1">
                                    {docType.documents.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                                      >
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">{doc.fileName}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {formatFileSize(doc.fileSize)} • {format(new Date(doc.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                                          </div>
                                          {doc.description && (
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                              {doc.description}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleView(doc)
                                            }}
                                            title="View"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDownload(doc)
                                            }}
                                            title="Download"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDelete(doc.id)
                                            }}
                                            title="Delete"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                // Fallback: Show flat document type grouping (backward compatibility)
                documentTypes.map((docType) => {
                  const typeKey = docType.type
                  const isTypeExpanded = expandedTypes.has(typeKey)

                  return (
                    <div key={typeKey} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                      {/* Document Type Header */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleType(typeKey)}
                      >
                        {isTypeExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        {isTypeExpanded ? (
                          <FolderOpen className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Folder className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="font-medium">{formatDocumentType(docType.type)}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {docType.count} {docType.count === 1 ? 'file' : 'files'}
                        </Badge>
                      </div>

                      {/* Documents */}
                      {isTypeExpanded && (
                        <div className="bg-white dark:bg-gray-900 border-t p-2 space-y-1">
                          {docType.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                            >
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{doc.fileName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatFileSize(doc.fileSize)} • {format(new Date(doc.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                                </div>
                                {doc.description && (
                                  <div className="text-xs text-gray-500 mt-1 truncate">
                                    {doc.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleView(doc)
                                  }}
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(doc)
                                  }}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(doc.id)
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
